import { createActionRegistry } from "../actions";
import { createDefaultDeleteAction } from "../actions/delete-actions";
import { createHeadingEnterAction } from "../actions/enter-actions";
import type { Handler } from "../actions/types";
import { createUndoRedoActions } from "../actions/undo-redo-actions";
import {
	processBlock as blockProcessor,
	createCursorManager,
} from "../dom/cursor";
import { isNode } from "../dom/utils";
import { createZWSManager } from "../dom/zw-manager";
import { createHistory, type History } from "../history/state-manager";
import { serializeToMarkdown } from "../parsers/serializer";
import { getCachedPatterns } from "../performance/cache";
import { debounce } from "../performance/debounce";
import { renderMarkdown } from "./renderer";
import { getClosestBlock } from "./utils";

// Modified version of your createEditor with better cursor management
export const createEditor = (element: HTMLElement, options = {}) => {
	const config = {
		cacheSize: 1000,
		debounceMs: 60,
		...options,
	};

	let history = createHistory();
	const patternCache = new Map();
	const pendingProcess = new Set<Node>();
	const actions = createActionRegistry();
	const cursorManager = createCursorManager(); // Add cursor manager
	const zwsManager = createZWSManager();

	let isTyping = false;
	let lastInputTime = 0;
	// <-- NEW: guard to avoid re-entrant processing triggered by our own mutations
	let isProcessing = false;
	// Small cap to avoid pathological repeated scheduling from the same run
	const MAX_FOLLOWUP_PASSES = 6;

	element.addEventListener("input", () => {
		isTyping = true;
		lastInputTime = Date.now();

		// Clear the typing flag after a short delay
		setTimeout(() => {
			if (Date.now() - lastInputTime >= 150) {
				isTyping = false;
			}
		}, 150);
	});

	function processBlock(block: Node) {
		// Use cursor-aware processing
		blockProcessor(block, block === element, cursorManager);
	}

	function hasUnprocessedMarkdown(block: ChildNode) {
		// Get text content but exclude text that's already inside formatted elements
		const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
		let textToCheck = "";

		while (walker.nextNode()) {
			const node = walker.currentNode;
			const parent = node.parentElement;

			// Skip text inside already-formatted elements
			if (parent && ["STRONG", "EM", "S"].includes(parent.tagName)) {
				continue;
			}

			textToCheck += node.textContent || "";
		}

		if (!textToCheck) return false;

		const patterns = getCachedPatterns(
			textToCheck,
			patternCache,
			config.cacheSize,
		);
		return !!patterns && patterns.length > 0;
	}

	function processPendingNodes(nodes: Node[], followupCount = 0) {
		if (isProcessing) return;
		if (followupCount > MAX_FOLLOWUP_PASSES) return;

		isProcessing = true;
		try {
			const processedBlocks = new Set<HTMLElement>();
			let hasChanges = false;

			for (const node of nodes) {
				if (!(node instanceof HTMLElement)) continue;

				const block = getClosestBlock(node, element);
				if (!block || processedBlocks.has(block)) continue;

				processedBlocks.add(block);
				const hadMarkdown = hasUnprocessedMarkdown(block);

				processBlock(block);

				// If we had markdown and still do, we need another pass
				if (hadMarkdown && hasUnprocessedMarkdown(block)) {
					hasChanges = true;
				}
			}

			if (hasChanges) {
				setTimeout(
					() => processPendingNodes([...processedBlocks], followupCount + 1),
					0,
				);
			}
		} finally {
			isProcessing = false;
		}
	}

	// Enhanced history state with better selection capture
	const saveHistoryState = (
		history: History,
		editor: HTMLElement,
		operation = "edit",
	) => {
		if (history.isUndoRedo) return history;

		const state = {
			html: editor.innerHTML,
			selection: cursorManager.captureSelectionState(editor), // Use better capture
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

	// Rest of your editor setup...
	const actionContext = {
		cursorManager,
		editor: element,
		getHistory: () => history,
		setHistory: (newHistory: History) => {
			history = newHistory;
		},
	};

	function setupActions() {
		actions.delete("delete");
		actions.register("delete", createDefaultDeleteAction());
		actions.register("heading-enter", createHeadingEnterAction());

		const undoRedoActions = createUndoRedoActions(processBlock);
		actions.register("undo", undoRedoActions.undo);
		actions.register("redo", undoRedoActions.redo);
	}

	setupActions();

	function handleKeydown(e: KeyboardEvent) {
		// Add this at the beginning of your existing function
		if (e.key === "ArrowRight" && !e.shiftKey) {
			if (zwsManager.isAtEndOfFormattedElement()) {
				e.preventDefault();
				zwsManager.escapeCursor();
				return;
			}
		}

		for (const [_name, action] of actions.entries()) {
			if (action.canHandle(e, actionContext)) {
				const result = action.handle(e, actionContext);
				if (result.preventDefault) {
					e.preventDefault();
				}
				if (result.shouldProcess) {
					const target = isNode(e.target) ? e.target : null;
					if (!target) return;
					setTimeout(() => {
						processPendingNodes([target]);
					}, 0);
				}
				return;
			}
		}

		if (e.key === "Enter") {
			history = saveHistoryState(history, element, "enter");
		}
	}

	element.addEventListener("keydown", handleKeydown);

	const debouncedProcess = debounce((nodes: Node[]) => {
		processPendingNodes(nodes);
	}, config.debounceMs);

	const mo = new MutationObserver((mutations) => {
		if (history.isUndoRedo) return;
		// if we're already in the middle of processing, ignore these mutations
		if (isProcessing) return;

		if (isTyping && Date.now() - lastInputTime < 100) {
			// Only process if there are clear markdown patterns
			const hasMarkdownPatterns = mutations.some((mut) => {
				if (mut.type === "characterData" && mut.target.textContent) {
					const text = mut.target.textContent;
					// Look for clear markdown indicators
					return (
						/[*_`~#-]/.test(text) &&
						(text.includes("**") ||
							text.includes("__") ||
							text.includes("*") ||
							text.includes("_") ||
							text.includes("`") ||
							text.includes("~~") ||
							text.match(/^#+\s/) ||
							text.match(/^[-*]\s/))
					);
				}
				return false;
			});

			if (!hasMarkdownPatterns) return;
		}

		mo.disconnect();
		for (const mut of mutations) {
			if (mut.type === "characterData") {
				if (mut.target.parentNode) {
					pendingProcess.add(mut.target.parentNode);
				}
			} else if (mut.type === "childList") {
				if (mut.target) pendingProcess.add(mut.target);
				for (const n of mut.addedNodes) pendingProcess.add(n);
				for (const _n of mut.removedNodes) pendingProcess.add(mut.target);
			}
		}
		debouncedProcess([...pendingProcess]);
		pendingProcess.clear();
		mo.observe(element, {
			subtree: true,
			characterData: true,
			childList: true,
			characterDataOldValue: true,
		});
	});

	mo.observe(element, {
		subtree: true,
		characterData: true,
		childList: true,
		characterDataOldValue: true,
	});

	return {
		element,
		getMarkdown: () => serializeToMarkdown(element),
		setContent: (content: string) => {
			if (!content.trim()) {
				element.innerHTML = "";
				return;
			}

			// Suppress mutation observer while we do synchronous processing
			if (isProcessing) return;
			isProcessing = true;

			try {
				const fragment = renderMarkdown(content, { includeZWS: true });

				element.innerHTML = "";
				element.appendChild(fragment);
			} finally {
				isProcessing = false;
			}
		},
		setDeleteMode: () => setupActions(),
		registerAction: (name: string, action: Handler) =>
			actions.register(name, action),
		destroy: () => {
			mo.disconnect();
			patternCache.clear();
			pendingProcess.clear();
			element.removeEventListener("keydown", handleKeydown);
		},
	};
};
