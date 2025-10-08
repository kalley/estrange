import { getClosestBlock } from "../core/utils";
import {
	getImmediateInlineParent,
	getOutermostInline,
} from "../dom/structure-utils";
import { isHTMLElement, isTextNode } from "../dom/utils";
import {
	createTextWalker,
	findPreviousTextNode,
	getDeepLastTextNode,
} from "../dom/walker";
import { isOnlyZWS, startsWithZWS } from "../dom/zw-utils";
import type { Handler } from "./types";
import { isKnownInlineElement } from "./utils";

export const createShiftArrowLeftAction = (): Handler => (_event, context) => {
	const selection = window.getSelection();
	if (!selection?.rangeCount) return null;

	const { focusNode, focusOffset } = selection;
	if (!focusNode) return null;

	// Check if we need to handle ZWS skipping
	if (!shouldHandleZWSNavigation(focusNode, focusOffset, context.editor)) {
		return null;
	}

	let changed = true;
	let iterations = 0;
	const MAX_ITERATIONS = 10;

	while (changed && iterations < MAX_ITERATIONS) {
		changed = false;
		changed ||= skipAfterInlineAdjacentZWS(selection);
		changed ||= skipInsideInlineZWS(selection, context.editor);
		changed ||= skipBlockBoundaryZWS(selection, context.editor);
		iterations++;
	}

	// Return the block where we ended up
	const finalFocus = selection.focusNode;
	return finalFocus ? getClosestBlock(finalFocus, context.editor) : null;
};

function shouldHandleZWSNavigation(
	node: Node,
	offset: number,
	editor: HTMLElement,
): boolean {
	// Only intervene if we're about to land on a ZWS
	if (!isTextNode(node)) return false;

	const text = node.textContent ?? "";

	// Check if current position has a ZWS at offset 0
	if (offset === 1 && startsWithZWS(text)) return true;

	// Check if we're at the start and previous node ends with content
	if (offset === 0) {
		const prev = findPreviousTextNode(node, editor);
		if (prev && startsWithZWS(prev.textContent ?? "")) return true;
	}

	return false;
}

function skipAfterInlineAdjacentZWS(selection: Selection): boolean {
	const { focusNode, focusOffset } = selection;
	if (!isTextNode(focusNode) || focusOffset !== 1) return false;

	if (!startsWithZWS(focusNode.textContent ?? "")) return false;

	const prevSibling = focusNode.previousSibling;
	if (!isHTMLElement(prevSibling) || !isKnownInlineElement(prevSibling)) {
		return false;
	}

	const lastText = getDeepLastTextNode(prevSibling);
	if (!isTextNode(lastText)) return false;

	selection.extend(lastText, lastText.textContent?.length ?? 0);
	return true;
}

function skipInsideInlineZWS(
	selection: Selection,
	editor: HTMLElement,
): boolean {
	const { focusNode, focusOffset } = selection;
	if (!isTextNode(focusNode) || focusOffset !== 1) return false;

	if (!startsWithZWS(focusNode.textContent ?? "")) return false;

	const immediateInline = getImmediateInlineParent(focusNode, editor);
	if (!immediateInline) return false;

	const outerInline = getOutermostInline(immediateInline, editor);
	const prevText = findPreviousTextNode(outerInline, editor);

	if (!isTextNode(prevText)) return false;

	selection.extend(prevText, prevText.textContent?.length ?? 0);
	return true;
}

function skipBlockBoundaryZWS(
	selection: Selection,
	editor: HTMLElement,
): boolean {
	const { focusNode, focusOffset } = selection;
	if (!isTextNode(focusNode) || focusOffset !== 1) return false;

	if (!startsWithZWS(focusNode.textContent ?? "")) return false;
	if (!isFirstTextNodeInBlock(focusNode, editor)) return false;

	const block = getClosestBlock(focusNode, editor);
	const prevBlock = block?.previousElementSibling;

	if (!prevBlock) return false;

	const lastText = getDeepLastTextNode(prevBlock);
	if (!isTextNode(lastText)) return false;

	selection.extend(lastText, lastText.textContent?.length ?? 0);
	return true;
}

function isFirstTextNodeInBlock(node: Text, editor: HTMLElement): boolean {
	const block = getClosestBlock(node, editor);
	if (!block) return false;

	const walker = createTextWalker(
		block,
		(n) => !isOnlyZWS(n.textContent ?? ""),
	);
	const firstText = walker.firstChild();
	return firstText === node;
}
