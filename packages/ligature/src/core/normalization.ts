import { normalizeZWSInNode } from "../dom/normalize-utils";
import { isHTMLElement, isTextNode } from "../dom/utils";
import { createTextWalker } from "../dom/walker";
import { ZWS } from "../dom/zw-utils";

export const normalizeRootChild = (node: Node) => {
	if (isTextNode(node)) {
		const text = node.textContent ?? "";
		const p = document.createElement("p");
		p.textContent = text;

		node.parentNode?.replaceChildren(p);
		ensureLeadingZWS(p);
		restoreCursor(p.firstChild ?? p, p.textContent?.length ?? 1);

		return p;
	} else if (isHTMLElement(node)) {
		const newNode = node.nodeName !== "P" ? document.createElement("p") : node;

		node.querySelector("br")?.remove();

		if (newNode !== node) {
			newNode.innerHTML = node.innerHTML;
			node.parentNode?.replaceChild(newNode, node);
		}

		ensureLeadingZWS(newNode);
		restoreCursor(newNode.firstChild ?? newNode, 1);

		return newNode;
	}

	return null;
};

const restoreCursor = (node: Node, offset: number) => {
	const selection = window.getSelection();
	if (!selection) return;

	const range = document.createRange();
	range.setStart(node, Math.min(offset, node.textContent?.length ?? 0));
	range.collapse(true);

	selection.removeAllRanges();
	selection.addRange(range);
};

const ensureLeadingZWS = (block: HTMLElement) => {
	const firstChild = block.firstChild;

	if (isTextNode(firstChild)) {
		const text = firstChild.textContent ?? "";

		if (!text.startsWith(ZWS)) {
			firstChild.textContent = `${ZWS}${text}`;
		}
	} else {
		block.insertBefore(document.createTextNode(ZWS), firstChild ?? null);
	}
};

export const normalizeInline = (node: HTMLElement) => {
	let replacementNode: HTMLElement | null = null;
	switch (node.nodeName) {
		case "B":
			replacementNode = document.createElement("strong");
			break;
		case "I":
			replacementNode = document.createElement("em");
			break;
		default:
			break;
	}

	if (replacementNode) {
		replacementNode.innerHTML = node.innerHTML;
		node.replaceWith(replacementNode);

		const selection = window.getSelection();

		if (selection) {
			selection.selectAllChildren(replacementNode);

			const block = replacementNode.parentElement;

			if (block) {
				// Normalize ZWS for each text node
				const walker = createTextWalker(replacementNode);
				while (walker.nextNode()) {
					const textNode = walker.currentNode;
					if (isTextNode(textNode)) normalizeZWSInNode(textNode);
				}
			}
		}
	}

	return replacementNode;
};
