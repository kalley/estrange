import { createActionRegistry } from "../actions";
import { createDeleteHandler, normalizeBlock } from "../actions/delete-action";
import { createPreventDefaultAction } from "../actions/prevent-default-action";
import { createShiftArrowLeftAction } from "../actions/shift-leftarrow-action";
import type { Handler } from "../actions/types";
import { processNode as blockProcessor } from "../dom/cursor";
import { getSelectionRange, setCursor } from "../dom/cursor-utils";
import { isHTMLElement, isTextNode } from "../dom/utils";
import { ZWS } from "../dom/zw-utils";
import {
	captureChangedBlocks,
	captureEditorState,
	createHistoryManager,
	type HistoryEntryType,
	type HistoryState,
	restoreEditorState,
	restoreSelection,
} from "../history";
import { createMutationProcessor } from "../observers/mutation-observer";
import { serializeToMarkdown } from "../parsers/serializer";
import { debounce } from "../performance/debounce";
import { renderMarkdown } from "./renderer";
import { getClosestBlock, uniqueId } from "./utils";

export interface EditorOptions {
	debounceMs?: number;
	value?: string;
}

export const createEditor = ({
	debounceMs = 60,
	value: _value = "",
}: EditorOptions = {}) => {
	let element: HTMLElement;
	let mutationProcessor: ReturnType<typeof createMutationProcessor>;
	const actions = createActionRegistry();
	let isProcessing = false;
	const historyManager = createHistoryManager({ maxSize: 100 });
	let lastSavedState!: HistoryState;
	let lastBlockId: string | null = null;

	// Debounced save for typing (longer delay than markdown processing)
	const debouncedHistorySave = debounce(() => {
		saveHistoryEntry("typing");
	}, 1000);

	function handleInput() {
		debouncedHistorySave();
	}

	function saveHistoryEntry(type: HistoryEntryType) {
		if (historyManager.isRestoring) return;

		const currentState = captureEditorState(element);

		// Skip if nothing changed
		if (!hasStateChanged(lastSavedState, currentState)) {
			return;
		}

		// Determine which blocks changed
		const changedBlocks = captureChangedBlocks(element, lastSavedState);

		// For "before", only include blocks that are about to change
		const beforeBlocks =
			lastSavedState?.blocks.filter((block) =>
				changedBlocks.some((changed) => changed.blockId === block.blockId),
			) || [];

		historyManager.push({
			type,
			before: {
				blocks: beforeBlocks,
				selection: lastSavedState?.selection || null,
			},
			after: {
				blocks: changedBlocks,
				selection: currentState.selection,
			},
		});

		lastSavedState = currentState;
	}

	function hasStateChanged(before: HistoryState, after: HistoryState): boolean {
		if (!before || !after) return true;

		// Compare block count
		if (before.blocks.length !== after.blocks.length) return true;

		// Compare each block's HTML
		for (let i = 0; i < before.blocks.length; i++) {
			if (before.blocks[i].html !== after.blocks[i].html) return true;
		}

		// Selection change alone doesn't count as a history-worthy change
		return false;
	}

	function handleUndo() {
		debouncedHistorySave.cancel();

		const state = historyManager.undo();
		if (!state) return;

		mutationProcessor.setRestoring(true);
		restoreEditorState(element, state);

		if (state.selection) {
			restoreSelection(element, state.selection);
		}

		lastSavedState = captureEditorState(element);

		queueMicrotask(() => {
			mutationProcessor.setRestoring(false);
		});
	}

	function handleRedo() {
		debouncedHistorySave.cancel();

		const state = historyManager.redo();
		if (!state) return;

		mutationProcessor.setRestoring(true);
		restoreEditorState(element, state);

		if (state.selection) {
			restoreSelection(element, state.selection);
		}

		lastSavedState = captureEditorState(element);

		queueMicrotask(() => {
			mutationProcessor.setRestoring(false);
		});
	}

	function processBlock(block: Node) {
		blockProcessor(block, block === element);
	}

	function processPendingNodes(nodes: Node[]) {
		if (isProcessing) return;

		isProcessing = true;

		try {
			for (const node of nodes) {
				const block = getClosestBlock(node, element);
				if (!block) continue;
				processBlock(block);
			}
		} finally {
			isProcessing = false;
		}
	}

	const actionContext = {
		get editor() {
			return element;
		},
	};

	function setupActions() {
		actions.register("backspace", createDeleteHandler());
		actions.register("mod+u", createPreventDefaultAction());
		actions.register("shift+arrowleft", createShiftArrowLeftAction());
	}

	function handleKeydown(event: KeyboardEvent) {
		// Handle undo/redo first
		if (
			(event.ctrlKey || event.metaKey) &&
			event.key === "z" &&
			!event.shiftKey
		) {
			event.preventDefault();
			handleUndo();
			return;
		}

		if (
			(event.ctrlKey || event.metaKey) &&
			((event.key === "z" && event.shiftKey) || event.key === "y")
		) {
			event.preventDefault();
			handleRedo();
			return;
		}

		// Handle custom actions
		const shouldCustomHandle = actions.canHandle(event);
		if (shouldCustomHandle) {
			mutationProcessor.withPaused(() => {
				actions.handle(event, actionContext);
			});
		}

		// Save before destructive operations
		if (isDestructiveKey(event.key)) {
			debouncedHistorySave.flush();

			queueMicrotask(() => {
				saveHistoryEntry(event.key === "Enter" ? "split" : "delete");
			});
		}

		// Always normalize after destructive keys
		if (isDestructiveKey(event.key)) {
			requestAnimationFrame(() => {
				const range = getSelectionRange();
				if (range) {
					const block = getClosestBlock(range.commonAncestorContainer, element);
					const selection = window.getSelection();
					if (block && selection) {
						normalizeBlock(block, selection);
					}
				}
			});
		}
	}

	const isDestructiveKey = (key: string): boolean => {
		return ["Backspace", "Delete", "Enter"].includes(key);
	};

	let isAdjustingCursor = false;

	function handleSelectionChange() {
		if (isAdjustingCursor) return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);

		// Only adjust collapsed cursors
		if (!range.collapsed) return;

		if (isCursorBeforeBlockStartZWS(range)) {
			isAdjustingCursor = true;

			try {
				setCursor(range.startContainer, 1);
			} finally {
				isAdjustingCursor = false;
			}
		}

		// Flush typing history when moving to different block
		const currentBlock = getClosestBlock(range.startContainer, element);
		const currentBlockId = currentBlock?.dataset.blockId;

		if (currentBlockId && currentBlockId !== lastBlockId) {
			debouncedHistorySave.flush();
			lastBlockId = currentBlockId;
		}
	}

	const isCursorBeforeBlockStartZWS = (range: Range): boolean => {
		if (!range.collapsed) return false;
		if (range.startOffset !== 0) return false;

		const container = range.startContainer;
		if (!isTextNode(container)) return false;

		const textNode = container;
		if (!textNode.textContent?.startsWith(ZWS)) return false;

		const block = getClosestBlock(textNode, element);
		return !!block && isFirstTextNodeInBlock(textNode, block);
	};

	const isFirstTextNodeInBlock = (
		textNode: Text,
		block: HTMLElement,
	): boolean => {
		const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
		return walker.nextNode() === textNode;
	};

	const debouncedProcess = debounce((nodes: Node[]) => {
		processPendingNodes(nodes);
	}, debounceMs);

	return {
		attach(el: HTMLElement) {
			element = el;

			if (!element.hasAttribute("contenteditable")) {
				element.setAttribute("contenteditable", "true");
			}

			// Create mutation processor
			mutationProcessor = createMutationProcessor(element, debouncedProcess, {
				onNormalize: () => {
					// Normalization triggers immediate history save
					debouncedHistorySave.flush();
				},
			});

			mutationProcessor.start();

			setupActions();

			element.addEventListener("keydown", handleKeydown);
			element.addEventListener("input", handleInput);
			document.addEventListener("selectionchange", handleSelectionChange);

			// Initial state capture
			lastSavedState = captureEditorState(element);
			const initialBlock = element.children[0];
			if (isHTMLElement(initialBlock)) {
				lastBlockId = initialBlock.dataset.blockId || null;
			}

			return this;
		},

		getMarkdown: () => serializeToMarkdown(element),

		setContent: (content: string) => {
			if (!content.trim()) {
				element.innerHTML = "";
				lastSavedState = captureEditorState(element);
				return;
			}

			if (isProcessing) return;

			mutationProcessor.withPaused(() => {
				isProcessing = true;

				try {
					const fragment = renderMarkdown(content, {
						includeZWS: true,
						preserveStructure: true,
					});

					element.innerHTML = "";
					element.appendChild(fragment);

					Array.from(element.children)
						.filter(isHTMLElement)
						.forEach((block) => {
							if (!block.dataset.blockId) {
								block.dataset.blockId = uniqueId("block");
							}
						});

					// Update saved state
					lastSavedState = captureEditorState(element);
				} finally {
					setTimeout(() => {
						isProcessing = false;
					}, 0);
				}
			});
		},

		setDeleteMode: () => setupActions(),

		registerAction: (name: string, action: Handler) =>
			actions.register(name, action),

		destroy: () => {
			mutationProcessor.destroy();
			debouncedHistorySave.cancel();
			debouncedProcess.cancel();
			element.removeEventListener("keydown", handleKeydown);
			document.removeEventListener("selectionchange", handleSelectionChange);
		},
	};
};
