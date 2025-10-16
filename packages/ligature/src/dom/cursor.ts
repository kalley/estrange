import { applyInlineFormatting, blockRenderers } from "../core/renderer";
import { type Block, parseBlockMarkdown } from "../parsers/block-parser";
import { isBlockElement } from "./structure-utils";
import { isHTMLElement } from "./utils";
import { createTextWalker, findLastTextNode } from "./walker";
import { stripZWS, ZWS } from "./zw-utils";

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
	if (isBlockElement(node) || isRoot) {
		const text = stripZWS(node.textContent ?? "");
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
		newElement.dataset.blockId = element.dataset.blockId;
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
