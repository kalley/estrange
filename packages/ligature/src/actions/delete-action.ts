// ============================================================================
// DELETE HANDLER
// ============================================================================

import { getClosestBlock } from "../core/utils";
import { withPreservedCursor } from "../core/with-utils";
import {
	getSelectionRange,
	moveCursorBeforeNode,
	moveCursorToEnd,
} from "../dom/cursor-utils";
import { normalizeZWSInNode, removeEmptyInlines } from "../dom/normalize-utils";
import {
	getImmediateInlineParent,
	getOutermostInline,
	hasContentBefore,
	isFirstChildInBlock,
	isInlineElement,
	isInlineEmpty,
} from "../dom/structure-utils";
import { isHTMLElement, isTextNode } from "../dom/utils";
import { createTextWalker, findLastTextNode } from "../dom/walker";
import {
	isOnlyZWS, // ← from dom/zw-utils
	ZWS,
} from "../dom/zw-utils";

import type { ActionContext, Handler } from "./types";

// ============================================================================
// MAIN HANDLER
// ============================================================================

export const createDeleteHandler = (): Handler => (event, context) => {
	const selection = window.getSelection();
	const range = getSelectionRange();

	if (!selection || !range || !range.collapsed) return null;

	// Phase 1: Normalize cursor position until stable
	let changed = true;
	let iterations = 0;
	const MAX_ITERATIONS = 10;

	while (changed && iterations < MAX_ITERATIONS) {
		changed = false;
		changed ||= normalizeAfterInlineAdjacentZWS();
		changed ||= normalizeInsideNonEmptyInline(selection, context.editor);
		iterations++;
	}

	// Phase 2: Handle block merge
	if (shouldMergeBlocks(context.editor)) {
		event.preventDefault();
		return handleBlockMerge(context);
	}

	// Phase 3: Let native delete happen
	const block = getClosestBlock(range.commonAncestorContainer, context.editor);

	return block;
};

// ============================================================================
// CURSOR NORMALIZERS
// ============================================================================

const normalizeAfterInlineAdjacentZWS = (): boolean => {
	const range = getSelectionRange();
	if (!range) return false;

	const node = range.startContainer;
	if (!isTextNode(node) || range.startOffset > 1) return false;

	const prevSibling = node.previousSibling;
	if (!isHTMLElement(prevSibling) || !isInlineElement(prevSibling)) {
		return false;
	}

	const textNode = findLastTextNode(prevSibling);
	if (!textNode) return false;

	range.selectNodeContents(textNode);
	range.collapse(false);
	return true;
};

const normalizeInsideNonEmptyInline = (
	selection: Selection,
	editor: HTMLElement,
): boolean => {
	const range = getSelectionRange();
	if (!range) return false;

	const node = range.startContainer;
	if (!isTextNode(node) || range.startOffset !== 1) return false;
	if (!node.textContent?.startsWith(ZWS)) return false;

	const immediateInline = getImmediateInlineParent(node, editor);
	if (!immediateInline) return false;

	const outerInline = getOutermostInline(immediateInline, editor);
	if (isInlineEmpty(outerInline)) return false;
	if (isFirstChildInBlock(outerInline, editor)) return false;
	if (!hasContentBefore(outerInline)) return false;

	return positionCursorBeforeInline(outerInline, selection);
};

// ============================================================================
// BLOCK MERGE LOGIC
// ============================================================================

const shouldMergeBlocks = (editor: HTMLElement): boolean => {
	const range = getSelectionRange();
	if (!range) return false;

	const block = getClosestBlock(range.commonAncestorContainer, editor);
	if (!block || !block.previousElementSibling) return false;

	if (block.firstChild !== range.startContainer) return false;
	if (block.textContent?.[0] !== ZWS) return false;

	return isTextNode(range.startContainer) && range.startOffset === 1;
};

const handleBlockMerge = (context: ActionContext): HTMLElement | null => {
	const range = getSelectionRange();
	if (!range) return null;

	const block = getClosestBlock(range.commonAncestorContainer, context.editor);
	if (!block) return null;

	const prevBlock = block.previousElementSibling;
	if (!isHTMLElement(prevBlock)) return null;

	moveCursorToEnd(prevBlock);

	while (block.firstChild) {
		prevBlock.appendChild(block.firstChild);
	}

	block.remove();

	return prevBlock;
};

// ============================================================================
// BLOCK NORMALIZATION
// ============================================================================

export const normalizeBlock = (
	block: HTMLElement,
	selection: Selection | null = window.getSelection(),
): void => {
	if (!selection) return;

	withPreservedCursor(selection, block, () => {
		removeEmptyInlines(block);

		// Normalize ZWS for each text node
		const walker = createTextWalker(block);
		while (walker.nextNode()) {
			const textNode = walker.currentNode;
			if (isTextNode(textNode)) normalizeZWSInNode(textNode);
		}
	});
};

// ============================================================================
// POSITIONING UTILITIES
// ============================================================================

const positionCursorBeforeInline = (
	inline: HTMLElement,
	selection: Selection,
): boolean => {
	let current = inline.previousSibling;

	while (current) {
		if (isTextNode(current)) {
			if (!isOnlyZWS(current.textContent || "")) {
				return moveCursorToEnd(current, selection);
			}
		} else if (isInlineElement(current)) {
			if (!isOnlyZWS(current.textContent || "")) {
				return moveCursorToEnd(current, selection);
			}
		} else {
			// hit a non-inline node (likely block boundary)
			return moveCursorBeforeNode(inline, selection);
		}
		current = current.previousSibling;
	}

	// If we hit the start of a block, position before inline itself
	return moveCursorBeforeNode(inline, selection);
};
