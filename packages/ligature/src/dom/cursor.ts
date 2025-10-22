import { applyInlineFormatting, blockRenderers } from "../core/renderer";
import { type Block, parseBlockMarkdown } from "../parsers/block-parser";
import { setCursor } from "./cursor-utils";
import { normalizeZWSInElement } from "./normalize-utils";
import { isBlockElement } from "./structure-utils";
import { isHTMLElement } from "./utils";
import { stripZWS } from "./zw-utils";

// Enhanced block processing that preserves cursor position
export const processNode = (node: Node, isRoot: boolean) => {
	if (!isHTMLElement(node)) return;

	// Handle lists - just apply inline formatting to list items
	if (node.tagName === "UL" || node.tagName === "OL") {
		[...node.querySelectorAll("li")].forEach((li) => {
			applyInlineFormattingWithCursor(li);
		});
		return;
	}

	// Handle block-level elements that might need conversion
	if (isBlockElement(node) || isRoot) {
		const text = stripZWS(node.textContent ?? "");
		const parsed = parseBlockMarkdown(text);

		if (parsed && (isRoot || needsToConvert(node, parsed))) {
			convertBlockElement(node, parsed, isRoot);
		} else {
			// Just apply inline formatting
			applyInlineFormattingWithCursor(node);
		}
	} else {
		// Just apply inline formatting
		applyInlineFormattingWithCursor(node);
	}
};

const needsToConvert = (node: HTMLElement, parsed: Block) => {
	const nodeName = node.tagName.toLowerCase();

	return nodeName === "p" && parsed.type !== nodeName;
};

const convertBlockElement = (
	element: HTMLElement,
	parsed: Block,
	isRoot: boolean,
) => {
	const renderOptions = { currentList: null };
	const newElement = blockRenderers[parsed.type](parsed, renderOptions);

	const targetNode = ["UL", "OL"].includes(newElement.tagName)
		? newElement.firstElementChild
		: newElement;

	if (isHTMLElement(targetNode))
		targetNode.dataset.blockId = element.dataset.blockId;

	if (isRoot) {
		element.innerHTML = "";
		element.appendChild(newElement);
	} else {
		// Replace the element
		element.replaceWith(newElement);
	}

	normalizeZWSInElement(newElement);

	if (targetNode) setCursor(targetNode, targetNode.textContent?.length || 1);
};

export const applyInlineFormattingWithCursor = (block: HTMLElement) => {
	const selection = window.getSelection();
	if (!selection?.rangeCount) {
		applyInlineFormatting(block);
		normalizeZWSInElement(block);
		return;
	}

	const range = selection.getRangeAt(0);

	// Only handle typing scenario (collapsed cursor in the block)
	if (!range.collapsed || !block.contains(range.startContainer)) {
		applyInlineFormatting(block);
		normalizeZWSInElement(block);
		return;
	}

	const result = applyInlineFormatting(block);
	normalizeZWSInElement(block);

	// Restore cursor if transformation happened
	if (result.newCursorPosition) {
		try {
			const newRange = document.createRange();
			newRange.setStart(
				result.newCursorPosition.node,
				result.newCursorPosition.offset,
			);
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);
		} catch (e) {
			console.warn("Failed to restore cursor:", e);
		}
	}
	// If transformed but no position returned, cursor stays where it fell
	// If not transformed, cursor never moved
};
