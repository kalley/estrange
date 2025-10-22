import { uniqueId } from "../core/utils";
import { setCursor } from "../dom/cursor-utils";
import { isHTMLElement, isTextNode } from "../dom/utils";
import { ensureBlockHasLeadingZWS, isOnlyZWS } from "../dom/zw-utils";

export const normalizeRootChild = (node: Node) => {
	// Convert stray text nodes to paragraphs
	if (isTextNode(node)) {
		const p = document.createElement("p");

		p.textContent = node.textContent ?? "";
		p.dataset.blockId = uniqueId("block");
		node.replaceWith(p);
		ensureBlockHasLeadingZWS(p);
		setCursor(p.firstChild ?? p, p.textContent?.length ?? 1);

		return p;
	}

	if (!isHTMLElement(node)) return null;

	// Handle list item Enter-to-break-out behavior
	if (node.tagName === "LI") {
		const converted = maybeConvertEmptyListItemsToParagraph(node);

		if (converted) return converted;
	}

	// Normalize other elements (convert to <p> if needed)
	return normalizeElement(node);
};

function maybeConvertEmptyListItemsToParagraph(
	node: HTMLElement,
): HTMLElement | null {
	// When user hits Enter in empty list item, browser creates two empty <li>s
	// Convert to paragraph break and clean up
	const prev = node.previousSibling;

	if (!prev || prev.nodeName !== "LI") return null;
	if (!isOnlyZWS(prev.textContent ?? "")) return null;

	const list = node.parentNode;
	const editor = list?.parentNode as HTMLElement | null;

	if (!editor) return null;

	const newP = document.createElement("p");

	newP.dataset.blockId = uniqueId("block");

	// Insert paragraph after the list
	if (list?.nextSibling) {
		editor.insertBefore(newP, list.nextSibling);
	} else {
		editor.appendChild(newP);
	}

	prev.remove();
	node.remove();

	// Clean up empty list to avoid cursor issues
	if (isHTMLElement(list) && !list?.hasChildNodes()) {
		list.remove();
	}

	ensureBlockHasLeadingZWS(newP);
	setCursor(newP.firstChild ?? newP, 1);

	return newP; // ← Added return
}

function normalizeElement(node: HTMLElement): HTMLElement {
	const shouldConvertToParagraph =
		node.tagName !== "P" && node.tagName !== "LI";
	const target = shouldConvertToParagraph ? document.createElement("p") : node;

	// Only set block ID if we don't already have one
	if (!target.dataset.blockId) {
		target.dataset.blockId = uniqueId("block");
	}

	// Remove stray breaks
	node.querySelector("br")?.remove();

	if (target !== node) {
		target.innerHTML = node.innerHTML;
		node.replaceWith(target); // ← More semantic than replaceChild
	}

	ensureBlockHasLeadingZWS(target);
	setCursor(target.firstChild ?? target, 1);

	return target;
}
