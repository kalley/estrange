import { isTextNode } from "../dom/utils";
import { createElementWalker, createTextWalker } from "../dom/walker";
import { normalizeZWS, startsWithZWS, ZWS } from "../dom/zw-utils";

export const normalizeFragmentZWS = (root: Node) => {
	root.normalize();

	// --- Pass 1: normalize all text nodes ---
	const textWalker = createTextWalker(root);
	while (textWalker.nextNode()) {
		const textNode = textWalker.currentNode;
		textNode.textContent = normalizeZWS(textNode.textContent ?? "");
	}

	// --- Pass 2: enforce ZWS presence for certain block and inline elements ---
	const elementWalker = createElementWalker(root);

	while (elementWalker.nextNode()) {
		const node = elementWalker.currentNode;
		const nodeName = node.nodeName;

		// 1️⃣ Block-level elements
		if (["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI"].includes(nodeName)) {
			const first = node.firstChild;

			if (!isTextNode(first)) {
				node.insertBefore(document.createTextNode(ZWS), first ?? null);
				node.normalize();
			} else {
				first.textContent = normalizeZWS(first.textContent ?? "");
			}
		}

		// 2️⃣ Inline formatting elements
		if (["STRONG", "EM", "CODE", "S"].includes(nodeName)) {
			const first = node.firstChild;
			const next = node.nextSibling;

			// Ensure leading ZWS inside the inline element
			if (!isTextNode(first)) {
				node.insertBefore(document.createTextNode(ZWS), first ?? null);
			} else if (!startsWithZWS(first.textContent ?? "")) {
				first.textContent = normalizeZWS(first.textContent ?? "");
			}

			// Ensure trailing ZWS *after* inline element
			if (
				!next ||
				!isTextNode(next) ||
				!startsWithZWS(next.textContent ?? "")
			) {
				node.after(document.createTextNode(ZWS));
			}
		}
	}
};
