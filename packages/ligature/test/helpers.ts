import { getByTestId } from "@testing-library/dom";
import type { ActionContext } from "../src/actions/types";
import { isKnownInlineElement } from "../src/actions/utils";
import { isHTMLElement } from "../src/dom/utils";
import { createTextWalker } from "../src/dom/walker";
import { ZWS } from "../src/dom/zw-utils";

export function assertSelection(
	selection: Selection | null,
): asserts selection is Selection {
	if (!selection) {
		throw new Error("Selection is null");
	}
}

export function assertZWSInvariants(
	editor: HTMLElement,
	options = { strict: true },
) {
	const walker = createTextWalker(editor);
	let node = walker.firstChild();
	const violations: string[] = [];

	while (node) {
		// node is already typed as Text - no need for isTextNode check
		if (!node.textContent?.startsWith(ZWS)) {
			violations.push(`Text node missing leading ZWS: "${node.textContent}"`);
		}

		// Check if previous sibling is inline element
		const prev = node.previousSibling;
		if (isHTMLElement(prev) && isKnownInlineElement(prev)) {
			// This text node should follow the inline
			if (!node.textContent?.startsWith(ZWS)) {
				violations.push(
					`Text after inline element missing leading ZWS: <${prev.tagName}>`,
				);
			}
		}

		node = walker.nextSibling();
	}

	if (violations.length > 0) {
		if (options.strict) {
			throw new Error(`Invariant violations:\n${violations.join("\n")}`);
		}
		return violations;
	}

	return [];
}

/**
 * Create a contenteditable editor with the given HTML content
 */
export function createEditor(content: string): HTMLElement {
	document.body.innerHTML = `<div contenteditable="true" data-testid="editor">${content}</div>`;
	return getByTestId(document.body, "editor");
}

/**
 * Place the cursor at a specific position in the DOM
 */
export function placeCursor(node: Node | null, offset: number) {
	if (!node) return;

	const range = document.createRange();
	range.setStart(node, offset);
	range.collapse(true);

	const sel = window.getSelection();
	sel?.removeAllRanges();
	sel?.addRange(range);
}

/**
 * Place cursor using a CSS selector and offset
 * Useful for targeting specific elements
 */
export function placeCursorInElement(
	editor: HTMLElement,
	selector: string,
	offset: number,
) {
	const element = editor.querySelector(selector);
	if (!element) throw new Error(`Element not found: ${selector}`);

	const textNode = getFirstTextNode(element);
	if (!textNode) throw new Error(`No text node found in: ${selector}`);

	placeCursor(textNode, offset);
}

/**
 * Get the first text node within an element
 */
export function getFirstTextNode(element: Node): Text | null {
	if (element.nodeType === Node.TEXT_NODE) return element as Text;

	for (const child of Array.from(element.childNodes)) {
		const result = getFirstTextNode(child);
		if (result) return result;
	}

	return null;
}

/**
 * Get the current cursor position as { node, offset }
 */
export function getCursorPosition() {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return null;

	const range = sel.getRangeAt(0);
	return {
		node: range.startContainer,
		offset: range.startOffset,
	};
}

/**
 * Simulate a keydown event on an element
 */
export function pressKey(
	editor: HTMLElement,
	key: string,
	options: { ctrlKey?: boolean; shiftKey?: boolean } = {},
) {
	const event = new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
		...options,
	});

	editor.dispatchEvent(event);
}

/**
 * Find a text node by its content
 */
export function findTextNode(
	editor: HTMLElement,
	content: string,
): Text | null {
	const walker = createTextWalker(editor);

	while (walker.nextNode()) {
		const node = walker.currentNode;
		if (node.textContent === content) {
			return node;
		}
	}

	return null;
}

/**
 * Create a mock ActionContext for testing
 * You'll need to customize this based on your actual ActionContext structure
 */
export function createMockContext(editor: HTMLElement): ActionContext {
	return {
		editor,
		getHistory: vitest.fn().mockReturnValue({ isUndoRedo: false, states: [] }),
		setHistory: vitest.fn(),
		cursorManager: {
			captureSelectionState: vitest.fn(),
			restoreSelectionState: vitest.fn(),
			captureIfInsideNode: vitest.fn(),
			restoreToNode: vitest.fn(),
			captureInElement: vitest.fn(),
			restoreInElement: vitest.fn(),
		},
	} as ActionContext;
}

/**
 * Helper to replace ${ZWS} placeholders with actual ZWS character
 */
export function withZWS(template: string): string {
	const div = document.createElement("div");
	div.innerHTML = template;

	const walker = createTextWalker(div);

	while (walker.nextNode()) {
		const node = walker.currentNode;

		node.textContent = `${ZWS}${node.textContent?.replaceAll(ZWS, "") || ""}`;
	}

	return div.innerHTML;
}

/**
 * Helper to remove cursor marker (|) from template strings
 * Useful for documenting where cursor should be in test setup
 */
export function withCursor(template: string): string {
	return template.replace(/\|/g, "");
}
