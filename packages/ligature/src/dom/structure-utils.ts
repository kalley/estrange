import { getClosestBlock } from "../core/utils";
import { isHTMLElement, isTextNode } from "./utils";
import { isOnlyZWS } from "./zw-utils";

const BLOCK_TAGS = new Set([
	"P",
	"OL",
	"UL",
	"LI",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
]);

export const isBlockElement = (
	element: Node,
): element is
	| HTMLParagraphElement
	| HTMLHeadingElement
	| HTMLLIElement
	| HTMLOListElement
	| HTMLUListElement => {
	return isHTMLElement(element) && BLOCK_TAGS.has(element.tagName);
};

const INLINE_TAGS = new Set(["STRONG", "EM", "CODE", "S"]);

export const isInlineElement = (el: Node) =>
	isHTMLElement(el) && INLINE_TAGS.has(el.tagName);

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
		if (isInlineElement(current)) return current;
		if (isBlockElement(current)) break;
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
			if (!isOnlyZWS(text)) {
				return true;
			}
		} else if (isHTMLElement(current) && isInlineElement(current)) {
			const text = current.textContent || "";
			if (!isOnlyZWS(text)) {
				return true;
			}
		} else {
			break;
		}
		current = current.previousSibling;
	}
	return false;
};
