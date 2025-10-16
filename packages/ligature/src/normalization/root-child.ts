import { uniqueId } from "../core/utils";
import { setCursor } from "../dom/cursor-utils";
import { isHTMLElement, isTextNode } from "../dom/utils";
import { ensureBlockHasLeadingZWS } from "../dom/zw-utils";

export const normalizeRootChild = (node: Node) => {
	if (isTextNode(node)) {
		const text = node.textContent ?? "";
		const p = document.createElement("p");
		p.textContent = text;
		p.dataset.blockId = uniqueId("block");

		node.parentNode?.replaceChildren(p);
		ensureBlockHasLeadingZWS(p);
		setCursor(p.firstChild ?? p, p.textContent?.length ?? 1);

		return p;
	} else if (isHTMLElement(node)) {
		const newNode = node.nodeName !== "P" ? document.createElement("p") : node;

		newNode.dataset.blockId =
			document.body.querySelectorAll(
				`[data-block-id="${node.dataset.blockId}"]`,
			).length > 1
				? uniqueId("block")
				: node.dataset.blockId;

		node.querySelector("br")?.remove();

		if (newNode !== node) {
			newNode.innerHTML = node.innerHTML;
			node.parentNode?.replaceChild(newNode, node);
		}

		ensureBlockHasLeadingZWS(newNode);
		setCursor(newNode.firstChild ?? newNode, 1);

		return newNode;
	}

	return null;
};
