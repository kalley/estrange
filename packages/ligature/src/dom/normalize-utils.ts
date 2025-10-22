import { isInlineElement, isInlineEmpty } from "./structure-utils";
import { createElementWalker, createTextWalker } from "./walker";
import { normalizeZWS, ZWS } from "./zw-utils";

const getInlineElements = (root: HTMLElement): HTMLElement[] => {
	return Array.from(root.querySelectorAll("strong, em, code, s"));
};

export const removeEmptyInlines = (root: HTMLElement): void => {
	for (const inline of getInlineElements(root).reverse()) {
		if (isInlineEmpty(inline)) inline.remove();
	}
};

export const normalizeZWSInNode = (node: Text): void => {
	const text = node.textContent || "";
	if (!text.includes(ZWS)) {
		node.textContent = ZWS + text;
		return;
	}
	const lastZWS = text.lastIndexOf(ZWS);
	if (lastZWS > 0) {
		node.textContent = normalizeZWS(text);
	}
};

export const normalizeZWSInElement = (element: Node): void => {
	if (!element.firstChild) {
		element.appendChild(document.createTextNode(ZWS));
		return;
	}

	const walker = createElementWalker(element);

	while (walker.nextNode()) {
		const textWalker = createTextWalker(walker.currentNode);

		while (textWalker.nextNode()) {
			normalizeZWSInNode(textWalker.currentNode);
		}

		if (isInlineElement(walker.currentNode)) {
			if (!walker.currentNode.nextSibling) {
				walker.currentNode.parentNode?.appendChild(
					document.createTextNode(ZWS),
				);
			}
		}
	}
};
