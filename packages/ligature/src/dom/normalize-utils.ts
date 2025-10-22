import { isInlineElement, isInlineEmpty } from "./structure-utils";
import { isHTMLElement, isTextNode } from "./utils";
import { normalizeZWS, startsWithZWS, ZWS } from "./zw-utils";

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

export const normalizeZWSInElement = (root: Node): void => {
	// Ensure the root has at least one text node
	if (!root.hasChildNodes()) {
		root.appendChild(document.createTextNode(ZWS));
		return;
	}

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
		null,
	);

	while (walker.nextNode()) {
		const node = walker.currentNode;

		// 1️⃣ Normalize all text nodes
		if (isTextNode(node)) {
			if (!startsWithZWS(node.textContent ?? "")) {
				node.textContent = normalizeZWS(node.textContent ?? "");
			}
			continue;
		}

		if (!isHTMLElement(node)) continue;

		// 2️⃣ Ensure every element has at least one text node
		if (!node.hasChildNodes()) {
			node.appendChild(document.createTextNode(ZWS));
		}

		// 3️⃣ Ensure inline elements are followed by ZWS
		if (isInlineElement(node)) {
			const next = node.nextSibling;

			if (!next) {
				// No next sibling → append ZWS to parent
				node.parentNode?.appendChild(document.createTextNode(ZWS));
				continue;
			}

			if (isTextNode(next)) {
				if (!startsWithZWS(next.textContent ?? "")) {
					next.textContent = normalizeZWS(next.textContent ?? "");
				}
				continue;
			}

			if (isHTMLElement(next)) {
				// If next is another element (block or inline), ensure a ZWS between
				node.parentNode?.insertBefore(document.createTextNode(ZWS), next);
			}
		}
	}
};
