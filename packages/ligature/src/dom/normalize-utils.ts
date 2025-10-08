import { isInlineEmpty } from "./structure-utils";
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
