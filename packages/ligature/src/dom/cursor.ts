import { applyInlineFormatting, blockRenderers } from "../core/renderer";
import { getNodeFromPath, getNodePath } from "../core/utils";
import { type Block, parseBlockMarkdown } from "../parsers/block-parser";
import { isHTMLElement, isTextNode } from "./utils";
import { createTextWalker, findLastTextNode } from "./walker";
import { ZWS } from "./zw-utils";

type SelectionRestore = (delta?: number) => void;

interface CapturedSelection {
	startOffset: number;
	endOffset: number;
	isCollapsed: boolean;
}

/**
 * Capture selection relative to the block, ignoring ZWS.
 */
export const captureSelectionForBlock = (
	block: HTMLElement,
): SelectionRestore | null => {
	const selection = window.getSelection();
	if (!selection?.rangeCount) return null;

	const range = selection.getRangeAt(0);
	if (
		!block.contains(range.startContainer) ||
		!block.contains(range.endContainer)
	) {
		return null;
	}

	// Helper to compute offset ignoring ZWS
	const getOffsetInBlock = (container: Node, containerOffset: number) => {
		let offset = 0;
		const walker = createTextWalker(block);
		let node: Text | null = walker.nextNode();

		while (node) {
			if (node === container) {
				const text = node.textContent || "";
				const visibleOffset = Math.min(containerOffset, text.length);
				const zwsCount = text.slice(0, visibleOffset).split(ZWS).length - 1;
				return offset + visibleOffset - zwsCount;
			} else {
				const text = node.textContent || "";
				const visibleLength = text.split(ZWS).join("").length;
				offset += visibleLength;
			}
			node = walker.nextNode();
		}
		return offset;
	};

	const captured: CapturedSelection = {
		startOffset: getOffsetInBlock(range.startContainer, range.startOffset),
		endOffset: getOffsetInBlock(range.endContainer, range.endOffset),
		isCollapsed: range.collapsed,
	};

	// Restore function with optional delta adjustment
	return (delta: number = 0) => {
		// Adjust offsets based on character count change
		const targetStart = Math.max(0, captured.startOffset - delta);
		const targetEnd = Math.max(0, captured.endOffset - delta);

		let cumulative = 0;
		const walker = createTextWalker(block);
		let node: Text | null = walker.nextNode();

		let startNode: Text | null = null;
		let startOffset = 0;
		let endNode: Text | null = null;
		let endOffset = 0;

		while (node) {
			const text = node.textContent || "";
			const visibleLength = text.split(ZWS).join("").length;

			// Start node
			if (!startNode && targetStart <= cumulative + visibleLength) {
				startNode = node;
				startOffset = targetStart - cumulative;
			}

			// End node
			if (!endNode && targetEnd <= cumulative + visibleLength) {
				endNode = node;
				endOffset = targetEnd - cumulative;
			}

			if (startNode && endNode) break;
			cumulative += visibleLength;
			node = walker.nextNode();
		}

		console.log({
			startNode,
			endNode,
			startOffset,
			endOffset,
			cumulative,
			delta,
			targetStart,
			targetEnd,
		});

		if (startNode && endNode) {
			// Map the visible offset back to actual offset in text node (accounting for ZWS)
			const mapOffset = (node: Text, visibleOffset: number) => {
				let offset = 0;
				let count = 0;
				for (const char of node.textContent || "") {
					if (char !== ZWS) count++;
					offset++;
					if (count === visibleOffset) break;
				}
				return offset;
			};

			const range2 = document.createRange();
			range2.setStart(startNode, mapOffset(startNode, startOffset));
			range2.setEnd(endNode, mapOffset(endNode, endOffset));

			const sel = window.getSelection();
			sel?.removeAllRanges();
			sel?.addRange(range2);
		}
	};
};

export interface SelectionState {
	startPath: number[];
	endPath: number[];
	startOffset: number;
	endOffset: number;
	startText: string;
	endText: string;
	startParentTag: string;
	endParentTag: string;
	isCollapsed: boolean;
	surroundingText: { before: string; after: string } | null;
}

// Better cursor management utilities
export const createCursorManager = () => {
	// More robust selection capture that works with DOM mutations
	const captureSelectionState = (
		editor: HTMLElement,
	): SelectionState | null => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return null;

		const range = selection.getRangeAt(0);
		const startContainer = range.startContainer;
		const endContainer = range.endContainer;

		// Instead of just paths, capture more context
		return {
			// Traditional paths as fallback
			startPath: getNodePath(startContainer, editor),
			startOffset: range.startOffset,
			endPath: getNodePath(endContainer, editor),
			endOffset: range.endOffset,

			// Additional context for more robust restoration
			startText: isTextNode(startContainer)
				? (startContainer.textContent ?? "")
				: "",
			endText: isTextNode(endContainer) ? (endContainer.textContent ?? "") : "",
			startParentTag: startContainer.parentElement?.tagName ?? "",
			endParentTag: endContainer.parentElement?.tagName ?? "",

			// For collapsed selections, store surrounding text context
			isCollapsed: range.collapsed,
			surroundingText: range.collapsed ? getSurroundingText(range, 20) : null,
		};
	};

	const getSurroundingText = (range: Range, contextLength = 20) => {
		if (!range.collapsed) return null;

		const container = range.startContainer;
		if (container.nodeType !== Node.TEXT_NODE) return null;

		const text = container.textContent || "";
		const offset = range.startOffset;

		return {
			before: text.slice(Math.max(0, offset - contextLength), offset),
			after: text.slice(offset, offset + contextLength),
		};
	};

	// Smart selection restoration that tries multiple strategies
	const restoreSelectionState = (
		editor: HTMLElement,
		selectionState: SelectionState | null,
	) => {
		if (!selectionState) return false;

		// Strategy 1: Try exact path restoration first
		try {
			const startNode = getNodeFromPath(selectionState.startPath, editor);
			const endNode = getNodeFromPath(selectionState.endPath, editor);

			if (startNode && endNode) {
				const range = document.createRange();
				range.setStart(
					startNode,
					Math.min(
						selectionState.startOffset,
						startNode.textContent?.length || 0,
					),
				);
				range.setEnd(
					endNode,
					Math.min(selectionState.endOffset, endNode.textContent?.length || 0),
				);

				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				return true;
			}
		} catch (_e) {
			// Path restoration failed, try other strategies
		}

		// Strategy 2: Find by text content and parent context
		if (
			(selectionState.isCollapsed && selectionState.surroundingText) ||
			selectionState.startParentTag
		) {
			const restored = restoreByElementContext(editor, selectionState);
			if (restored) return true;
		}

		// Fallback: Focus the editor
		editor.focus();
		return false;
	};

	const restoreByElementContext = (
		editor: HTMLElement,
		selectionState: SelectionState,
	) => {
		const elements = editor.querySelectorAll(
			selectionState.startParentTag.toLowerCase(),
		);

		// Try to find element with similar content
		for (const element of elements) {
			if (
				element.textContent?.includes(selectionState.startText.slice(0, 10))
			) {
				try {
					const range = document.createRange();
					const firstTextNode = getFirstTextNode(element);
					if (firstTextNode) {
						range.setStart(firstTextNode, 0);
						range.collapse(true);

						const sel = window.getSelection();
						sel?.removeAllRanges();
						sel?.addRange(range);
						return true;
					}
				} catch (_e) {}
			}
		}
		return false;
	};

	const getFirstTextNode = (element: Node) => {
		const walker = createTextWalker(
			element,
			(node) => !!node.textContent?.trim(),
		);
		return walker.nextNode();
	};

	const captureIfInsideNode = (
		node: Node,
	): {
		textNode: Text;
		offset: number;
		textContent: string;
		parentTag: string;
	} | null => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return null;

		const range = selection.getRangeAt(0);

		if (range.startContainer === node && isTextNode(node)) {
			return {
				textNode: node as Text,
				offset: range.startOffset,
				// Store more context for better restoration
				textContent: node.textContent || "",
				parentTag: node.parentElement?.tagName || "",
			};
		}

		// Also handle if selection is inside a descendant of this node
		if (node.contains(range.startContainer)) {
			const container = range.startContainer;

			if (isTextNode(container)) {
				return {
					textNode: container,
					offset: range.startOffset,
					textContent: container.textContent || "",
					parentTag: container.parentElement?.tagName || "",
				};
			}
		}

		return null;
	};

	/**
	 * Restore the selection into the given text node + offset.
	 * Collapsed by design.
	 */
	const restoreToNode = (textNode: Text, offset: number) => {
		try {
			// Ensure we have a valid text node
			if (!isTextNode(textNode)) return;
			// Ensure the text node is still in the document
			if (!document.contains(textNode)) return;

			const range = document.createRange();
			const maxOffset = textNode.textContent?.length || 0;
			const safeOffset = Math.min(Math.max(0, offset), maxOffset);

			if (safeOffset < 0 || safeOffset > maxOffset) return;

			range.setStart(textNode, safeOffset);
			range.collapse(true);

			const sel = window.getSelection();
			sel?.removeAllRanges();
			sel?.addRange(range);
		} catch (_e) {
			// Fallback: try to focus the parent element
			let parent = textNode.parentElement;
			while (parent && !parent.focus) {
				parent = parent.parentElement;
			}
			if (parent?.focus) {
				parent.focus();
			}
		}
	};

	const captureInElement = (element: HTMLElement) => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return null;

		const range = selection.getRangeAt(0);
		if (!element.contains(range.startContainer)) return null;

		// Calculate text offset from the beginning of the element
		const textOffset = getTextOffsetInElement(
			element,
			range.startContainer,
			range.startOffset,
		);

		return {
			element,
			textOffset,
			originalText: element.textContent || "",
		};
	};

	const restoreInElement = (capture: {
		element: HTMLElement;
		textOffset: number;
	}) => {
		const { element, textOffset } = capture;

		// Find the text node and offset that corresponds to our text offset
		const walker = createTextWalker(element);
		let currentOffset = 0;
		let node = walker.nextNode();

		while (node) {
			const nodeLength = (node.textContent || "").length;

			if (textOffset <= currentOffset + nodeLength) {
				const nodeOffset = textOffset - currentOffset;
				restoreToNode(node, nodeOffset);
				return true;
			}

			currentOffset += nodeLength;
			node = walker.nextNode();
		}

		return false;
	};

	const getTextOffsetInElement = (
		element: HTMLElement,
		container: Node,
		offset: number,
	): number => {
		const walker = createTextWalker(element);
		let totalOffset = 0;
		let node = walker.nextNode();

		while (node && node !== container) {
			totalOffset += (node.textContent || "").length;
			node = walker.nextNode();
		}

		return totalOffset + offset;
	};

	return {
		captureSelectionState,
		restoreSelectionState,
		captureIfInsideNode,
		restoreToNode,
		captureInElement,
		restoreInElement,
	};
};

export type CursorManager = ReturnType<typeof createCursorManager>;

const shouldProcessAsBlock = (element: HTMLElement) => {
	return (
		element.tagName === "P" ||
		element.tagName === "OL" ||
		element.tagName === "UL" ||
		(element.tagName.startsWith("H") && element.tagName.length === 2)
	);
};

// Enhanced block processing that preserves cursor position
export const processNode = (node: Node, isRoot: boolean) => {
	if (!isHTMLElement(node)) return;

	// Handle lists - just apply inline formatting to list items
	if (node.tagName === "UL" || node.tagName === "OL") {
		[...node.querySelectorAll("li")].forEach((li) => {
			applyInlineFormattingWithCursor(li, true);
		});
		return;
	}

	// Handle block-level elements that might need conversion
	if (shouldProcessAsBlock(node) || isRoot) {
		const text = node.textContent?.replaceAll(ZWS, "") || "";
		const parsed = parseBlockMarkdown(text, {
			includeZWS: true,
			preserveStructure: true,
		});

		if (parsed && (isRoot || needsToConvert(node, parsed))) {
			convertBlockElement(node, parsed, isRoot);
		} else {
			// Just apply inline formatting
			applyInlineFormattingWithCursor(node, true);
		}
	} else {
		// Just apply inline formatting
		applyInlineFormattingWithCursor(node, true);
	}
};

const needsToConvert = (node: HTMLElement, parsed: Block) => {
	return parsed.type !== node.tagName.toLowerCase();
};

const convertBlockElement = (
	element: HTMLElement,
	parsed: Block,
	isRoot: boolean,
) => {
	// Use your block renderers!
	const renderOptions = { includeZWS: true, currentList: null };
	const newElement = blockRenderers[parsed.type](parsed, renderOptions);

	if (isRoot) {
		element.innerHTML = "";
		element.appendChild(newElement);
	} else {
		// Replace the element
		element.replaceWith(newElement);
	}
};

export const applyInlineFormattingWithCursor = (
	block: HTMLElement,
	includeZWS: boolean,
) => {
	const selection = window.getSelection();
	if (!selection?.rangeCount) {
		applyInlineFormatting(block, includeZWS);
		return;
	}

	const range = selection.getRangeAt(0);

	// Only handle typing scenario (collapsed cursor in the block)
	if (!range.collapsed || !block.contains(range.startContainer)) {
		applyInlineFormatting(block, includeZWS);
		return;
	}

	const result = applyInlineFormatting(block, includeZWS);

	// Restore cursor if transformation happened
	if (result.newCursorPosition) {
		try {
			const newRange = document.createRange();
			newRange.setStart(
				result.newCursorPosition.node,
				result.newCursorPosition.offset,
			);
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);
		} catch (e) {
			console.warn("Failed to restore cursor:", e);
		}
	}
	// If transformed but no position returned, cursor stays where it fell
	// If not transformed, cursor never moved
};

export const getSelectionRange = (): Range | null => {
	const selection = window.getSelection();
	return selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
};

export const moveCursorToEnd = (element: HTMLElement): void => {
	const range = document.createRange();
	const selection = window.getSelection();
	const lastTextNode = findLastTextNode(element);
	if (lastTextNode) {
		range.setStart(lastTextNode, lastTextNode.textContent?.length ?? 0);
	} else {
		range.setStart(element, element.childNodes.length);
	}
	range.collapse(true);
	selection?.removeAllRanges();
	selection?.addRange(range);
};

export const moveCursorToStart = (element: HTMLElement): void => {
	const range = document.createRange();
	const selection = window.getSelection();
	range.setStart(element, 0);
	range.collapse(true);
	selection?.removeAllRanges();
	selection?.addRange(range);
};

export const restoreCursor = (
	selection: Selection,
	savedContainer: Node,
	savedOffset: number,
	fallback: HTMLElement,
): void => {
	try {
		const range = document.createRange();
		range.setStart(savedContainer, savedOffset);
		range.collapse(true);
		selection.removeAllRanges();
		selection.addRange(range);
	} catch {
		moveCursorToStart(fallback);
	}
};
