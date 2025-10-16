import { normalizeZWSInNode } from "../dom/normalize-utils";
import { createTextWalker } from "../dom/walker";

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
				const walker = createTextWalker(block);

				while (walker.nextNode()) {
					normalizeZWSInNode(walker.currentNode);
				}
			}
		}
	}

	return replacementNode;
};
