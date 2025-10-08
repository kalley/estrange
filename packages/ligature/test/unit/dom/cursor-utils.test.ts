import { getByText } from "@testing-library/dom";
import {
	getSelectionRange,
	moveCursorAfterNode,
	moveCursorBeforeNode,
	moveCursorToEnd,
	moveCursorToStart,
	restoreCursor,
} from "../../../src/dom/cursor-utils";

describe("cursor-utils", () => {
	let container: HTMLElement;
	let selection: Selection;

	beforeEach(() => {
		document.body.innerHTML = ""; // clear between tests
		container = document.createElement("div");
		document.body.appendChild(container);
		selection = window.getSelection()!;
		selection?.removeAllRanges();
	});

	// -------------------------------------------------------------------------
	// Basic Helpers
	// -------------------------------------------------------------------------

	const createTextNode = (text: string): Text => {
		const node = document.createTextNode(text);
		container.appendChild(node);
		return node;
	};

	const createInline = (html: string): HTMLElement => {
		const el = document.createElement("strong");
		el.innerHTML = html;
		container.appendChild(el);
		return el;
	};

	const expectCursor = (node: Node, offset: number) => {
		const range = getSelectionRange();
		expect(range).not.toBeNull();
		expect(range?.startContainer).toBe(node);
		expect(range?.startOffset).toBe(offset);
		expect(range?.collapsed).toBe(true);
	};

	// -------------------------------------------------------------------------
	// moveCursorToStart
	// -------------------------------------------------------------------------

	it("moves cursor to start of text node", () => {
		const node = createTextNode("abc");
		const ok = moveCursorToStart(node);
		expect(ok).toBe(true);
		expectCursor(node, 0);
	});

	it("moves cursor to start of element contents", () => {
		const el = createInline("abc");
		const ok = moveCursorToStart(el);
		expect(ok).toBe(true);

		const range = getSelectionRange();

		expect(range?.startContainer.textContent?.startsWith("abc")).toBe(true);
		expect(range?.startOffset).toBe(0);
	});

	// -------------------------------------------------------------------------
	// moveCursorToEnd
	// -------------------------------------------------------------------------

	it("moves cursor to end of text node", () => {
		const node = createTextNode("hello");
		const ok = moveCursorToEnd(node);
		expect(ok).toBe(true);
		expectCursor(node, 5);
	});

	it("moves cursor to end of nested inline", () => {
		const el = createInline("abc<em>def</em>");
		const ok = moveCursorToEnd(el);
		expect(ok).toBe(true);
		const lastText = getByText(el, "def");
		expectCursor(lastText.firstChild ?? lastText, 3);
	});

	it("falls back to end of element when no text nodes", () => {
		const el = document.createElement("div");
		container.appendChild(el);
		const ok = moveCursorToEnd(el);
		expect(ok).toBe(true);
		const range = getSelectionRange();
		expect(range?.startContainer).toBe(el);
		expect(range?.startOffset).toBe(0); // empty element, offset 0 == end
	});

	// -------------------------------------------------------------------------
	// moveCursorBeforeNode / moveCursorAfterNode
	// -------------------------------------------------------------------------

	it("positions cursor before a given node", () => {
		createTextNode("first");
		const second = createTextNode("second");
		const ok = moveCursorBeforeNode(second);
		expect(ok).toBe(true);
		expectCursor(container, 1); // before 'second', after 'first'
	});

	it("positions cursor after a given node", () => {
		const first = createTextNode("first");
		createTextNode("second");
		const ok = moveCursorAfterNode(first);
		expect(ok).toBe(true);
		expectCursor(container, 1); // right after 'first'
	});

	// -------------------------------------------------------------------------
	// restoreCursor
	// -------------------------------------------------------------------------

	it("restores cursor to a saved position", () => {
		const node = createTextNode("abc");
		const range = document.createRange();
		range.setStart(node, 2);
		range.collapse(true);
		selection?.addRange(range);

		const savedContainer = node;
		const savedOffset = 2;
		moveCursorToStart(node); // move it elsewhere

		restoreCursor(selection, savedContainer, savedOffset, container);
		expectCursor(node, 2);
	});

	it("falls back if saved node removed", () => {
		const node = createTextNode("abc");
		const savedContainer = node;
		const savedOffset = 2;
		node.remove();

		restoreCursor(selection, savedContainer, savedOffset, container);
		const range = getSelectionRange();
		expect(range?.startContainer).toBe(container.firstChild ?? container);
		expect(range?.startOffset).toBe(0);
	});
});
