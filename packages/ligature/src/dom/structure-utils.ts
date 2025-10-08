import { isKnownInlineElement } from "../actions/utils";
import { getClosestBlock } from "../core/utils";
import { isHTMLElement, isTextNode } from "./utils";
import { isOnlyZWS, ZWS } from "./zw-utils";

const shouldProcessAsBlock = (element: HTMLElement): boolean => {
	return (
		element.tagName === "P" ||
		element.tagName === "OL" ||
		element.tagName === "UL" ||
		element.tagName === "LI" ||
		(element.tagName.startsWith("H") && element.tagName.length === 2)
	);
};

export const isInlineElement = (el: Node): el is HTMLElement =>
	isHTMLElement(el) && isKnownInlineElement(el);

export const getOutermostInline = (
	el: HTMLElement,
	editor: HTMLElement,
): HTMLElement => {
	let outer = el;
	let current = el.parentElement;
	while (current && current !== editor && isInlineElement(current)) {
		outer = current;
		current = current.parentElement;
	}
	return outer;
};

export const getImmediateInlineParent = (
	node: Node,
	editor: HTMLElement,
): HTMLElement | null => {
	let current = node.parentElement;
	while (current && current !== editor) {
		if (isKnownInlineElement(current)) return current;
		if (shouldProcessAsBlock(current)) break;
		current = current.parentElement;
	}
	return null;
};

export const isInlineEmpty = (el: HTMLElement): boolean =>
	!el.textContent || isOnlyZWS(el.textContent);

export const isFirstChildInBlock = (
	inline: Node,
	editor: HTMLElement,
): boolean => {
	const block = getClosestBlock(inline, editor);
	if (!block) return false;
	const children = Array.from(block.childNodes);
	for (const child of children) {
		if (child === inline) return true;
		if (isHTMLElement(child) && child.textContent?.trim()) return false;
		if (isTextNode(child) && child.textContent?.trim()) return false;
	}
	return false;
};

export const hasContentBefore = (inline: HTMLElement): boolean => {
	let current = inline.previousSibling;
	while (current) {
		if (isTextNode(current)) {
			const text = current.textContent || "";
			if (text.length > 1 || (text.length === 1 && text !== ZWS)) {
				return true;
			}
		} else if (isHTMLElement(current) && isKnownInlineElement(current)) {
			const text = current.textContent || "";
			if (text.length > 0 && text !== ZWS) {
				return true;
			}
		} else {
			break;
		}
		current = current.previousSibling;
	}
	return false;
};
