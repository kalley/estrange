import { createActionRegistry } from "../actions";
import { createDeleteHandler, normalizeBlock } from "../actions/delete-action";
import { createPreventDefaultAction } from "../actions/prevent-default-action";
import { createShiftArrowLeftAction } from "../actions/shift-leftarrow-action";
import type { Handler } from "../actions/types";
import {
	processNode as blockProcessor,
	createCursorManager,
	getSelectionRange,
} from "../dom/cursor";
import { isHTMLElement, isTextNode } from "../dom/utils";
import { ZWS } from "../dom/zw-utils";
import { createHistory, type History } from "../history/state-manager";
import { BLOCK_REGEXES } from "../parsers/block-parser";
import { INLINE_MARKERS } from "../parsers/inline-parser";
import { serializeToMarkdown } from "../parsers/serializer";
import { debounce } from "../performance/debounce";
import { normalizeInline, normalizeRootChild } from "./normalization";
import { renderMarkdown } from "./renderer";
import { getClosestBlock, getClosestNonTextNode } from "./utils";

export interface EditorOptions {
	debounceMs?: number;
	value?: string;
}

export const createEditor = ({
	debounceMs = 60,
	value: _value = "",
}: EditorOptions = {}) => {
	let element: HTMLElement;
	let history = createHistory();
	const patternCache = new Map();
	const pendingProcess = new Set<Node>();
	const actions = createActionRegistry();
	const cursorManager = createCursorManager();
	let isProcessing = false;
	const MAX_FOLLOWUP_PASSES = 6;

	// All your existing functions stay the same, but reference `element` directly
	function processBlock(block: Node) {
		blockProcessor(block, block === element);
	}

	function processPendingNodes(nodes: Node[], followupCount = 0) {
		if (isProcessing || followupCount > MAX_FOLLOWUP_PASSES) return;

		isProcessing = true;
		try {
			for (const node of nodes) {
				const block = getClosestNonTextNode(node, element);

				if (!block) continue;

				processBlock(block);

				// const selection = window.getSelection();

				// if (isHTMLElement(block) && selection) {
				// 	normalizeBlock(block, selection);
				// }
			}
		} finally {
			isProcessing = false;
		}
	}

	const saveHistoryState = (
		history: History,
		editor: HTMLElement,
		operation = "edit",
	) => {
		if (history.isUndoRedo) return history;

		const state = {
			html: editor.innerHTML,
			selection: cursorManager.captureSelectionState(editor),
			timestamp: Date.now(),
			operation,
		};

		const states = [
			...history.states.slice(0, history.currentIndex + 1),
			state,
		];
		const trimmedStates =
			states.length > history.maxSize ? states.slice(-history.maxSize) : states;

		return {
			...history,
			states: trimmedStates,
			currentIndex: trimmedStates.length - 1,
		};
	};

	const actionContext = {
		cursorManager,
		get editor() {
			return element;
		},
		getHistory: () => history,
		setHistory: (newHistory: History) => {
			history = newHistory;
		},
	};

	function setupActions() {
		actions.register("backspace", createDeleteHandler());
		actions.register("mod+u", createPreventDefaultAction());
		actions.register("shift+arrowleft", createShiftArrowLeftAction());
	}

	let isSelectingText = false;

	function handleKeydown(event: KeyboardEvent) {
		const shouldCustomHandle = actions.canHandle(event);

		isSelectingText = event.key.startsWith("Arrow") && event.shiftKey;

		if (shouldCustomHandle) {
			withObserverPaused(() => {
				actions.handle(event, actionContext);
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

		if (event.key === "Enter") {
			history = saveHistoryState(history, element, "enter");
		}
	}

	const isDestructiveKey = (key: string): boolean => {
		return ["Backspace", "Delete", "Enter"].includes(key);
	};

	let isAdjustingCursor = false;

	function handleSelectionChange() {
		if (isAdjustingCursor || isSelectingText) {
			isSelectingText = false;
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);

		// Only adjust collapsed cursors - leave selections alone
		if (!range.collapsed) return;

		if (isCursorBeforeBlockStartZWS(range)) {
			isAdjustingCursor = true;

			try {
				const textNode = range.startContainer as Text;
				const newRange = document.createRange();
				newRange.setStart(textNode, 1);
				newRange.collapse(true);

				selection.removeAllRanges();
				selection.addRange(newRange);
			} finally {
				isAdjustingCursor = false;
			}
		}
	}

	const isCursorBeforeBlockStartZWS = (range: Range): boolean => {
		// Only handle collapsed cursor
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
		mo.observe(element, {
			subtree: true,
			characterData: true,
			childList: true,
			characterDataOldValue: true,
		});
	}, debounceMs);

	const mo = new MutationObserver((mutations) => {
		if (history.isUndoRedo || isProcessing) return;

		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.parentNode === element) {
					let normalized: Node | null = null;

					withObserverPaused(() => {
						normalized = normalizeRootChild(node);
					});

					if (normalized) return;
				} else if (isHTMLElement(node) && ["B", "I"].includes(node.nodeName)) {
					let normalized: Node | null = null;

					withObserverPaused(() => {
						normalized = normalizeInline(node);
					});

					if (normalized) return;
				}
			}
		}

		const hasMarkdownPatterns = mutations.some((mut) => {
			if (mut.type !== "characterData" || !mut.target.textContent) return false;

			const text = mut.target.textContent.replace(new RegExp(`^${ZWS}`), "");

			return (
				INLINE_MARKERS.some((marker) => text.includes(marker)) ||
				BLOCK_REGEXES.some((regex) => regex.test(text))
			);
		});

		if (!hasMarkdownPatterns) return;
		mo.disconnect();

		for (const mut of mutations) {
			if (mut.type === "characterData") {
				pendingProcess.add(mut.target);
			}
		}
		debouncedProcess([...pendingProcess]);
		pendingProcess.clear();
	});

	function withObserverPaused<T>(fn: () => T): T {
		mo.disconnect();
		try {
			return fn();
		} finally {
			requestAnimationFrame(() => {
				mo.observe(element, {
					subtree: true,
					characterData: true,
					childList: true,
					characterDataOldValue: true,
				});
			});
		}
	}

	return {
		attach(el: HTMLElement) {
			element = el;

			if (!element.hasAttribute("contenteditable")) {
				element.setAttribute("contenteditable", "true");
			}

			setupActions();

			element.addEventListener("keydown", handleKeydown);
			document.addEventListener("selectionchange", handleSelectionChange);

			mo.observe(element, {
				subtree: true,
				characterData: true,
				childList: true,
				characterDataOldValue: true,
			});

			return this;
		},

		getMarkdown: () => serializeToMarkdown(element),

		setContent: (content: string) => {
			if (!content.trim()) {
				element.innerHTML = "";
				return;
			}

			if (isProcessing) return;

			withObserverPaused(() => {
				isProcessing = true;

				try {
					const fragment = renderMarkdown(content, {
						includeZWS: true,
						preserveStructure: true,
					});

					element.innerHTML = "";
					element.appendChild(fragment);
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
			mo.disconnect();
			patternCache.clear();
			pendingProcess.clear();
			element.removeEventListener("keydown", handleKeydown);
			document.removeEventListener("selectionchange", handleSelectionChange);
		},
	};
};
