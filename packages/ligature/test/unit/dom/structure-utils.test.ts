import { getByText } from "@testing-library/dom";
import {
	getImmediateInlineParent,
	getOutermostInline,
	hasContentBefore,
	isBlockElement,
	isFirstChildInBlock,
	isInlineElement,
	isInlineEmpty,
} from "../../../src/dom/structure-utils";
import { ZWS } from "../../../src/dom/zw-utils";

function createElement(tagName: string, content = "") {
	const element = document.createElement(tagName);
	element.innerHTML = content;
	return element;
}

describe("isBlockElement", () => {
	it("returns true for block elements", () => {
		expect(isBlockElement(document.createElement("ol"))).toBe(true);
		expect(isBlockElement(document.createElement("ul"))).toBe(true);
		expect(isBlockElement(document.createElement("li"))).toBe(true);
		expect(isBlockElement(document.createElement("p"))).toBe(true);
		expect(isBlockElement(document.createElement("h1"))).toBe(true);
	});

	it("returns false for inline elements", () => {
		expect(isBlockElement(document.createElement("strong"))).toBe(false);
		expect(isBlockElement(document.createElement("em"))).toBe(false);
		expect(isBlockElement(document.createElement("s"))).toBe(false);
	});
});

describe("isInlineElement", () => {
	it("returns true for inline elements", () => {
		expect(isInlineElement(document.createElement("strong"))).toBe(true);
		expect(isInlineElement(document.createElement("em"))).toBe(true);
		expect(isInlineElement(document.createElement("s"))).toBe(true);
	});

	it("returns false for block elements", () => {
		expect(isInlineElement(document.createElement("ol"))).toBe(false);
		expect(isInlineElement(document.createElement("ul"))).toBe(false);
		expect(isInlineElement(document.createElement("li"))).toBe(false);
		expect(isInlineElement(document.createElement("p"))).toBe(false);
		expect(isInlineElement(document.createElement("h1"))).toBe(false);
	});
});

describe("getOutermostInline", () => {
	it("returns the outermost inline element", () => {
		const div = document.createElement("div");
		div.innerHTML = "<strong><em><s>text</s></em></strong>";
		expect(getOutermostInline(getByText(div, "text"), div)).toBe(
			div.firstChild,
		);
	});
});

describe("getImmediateInlineParent", () => {
	it("returns the immediate inline parent", () => {
		const div = document.createElement("div");
		div.innerHTML = "<strong><em><s>text</s></em></strong>";
		expect(getImmediateInlineParent(getByText(div, "text"), div)).toBe(
			div.querySelector("em"),
		);
	});
});

describe("isInlineEmpty", () => {
	it("returns true for empty inline elements", () => {
		expect(isInlineEmpty(createElement("strong"))).toBe(true);
		expect(isInlineEmpty(createElement("em"))).toBe(true);
		expect(isInlineEmpty(createElement("s"))).toBe(true);
	});

	it("returns true when the only text node is a ZWS", () => {
		expect(isInlineEmpty(createElement("strong", ZWS))).toBe(true);
	});

	it("returns false for non-empty inline elements", () => {
		expect(isInlineEmpty(createElement("strong", "Text"))).toBe(false);
		expect(isInlineEmpty(createElement("em", "Text"))).toBe(false);
		expect(isInlineEmpty(createElement("s", "Text"))).toBe(false);
	});
});

describe("isFirstChildInBlock", () => {
	it("returns false when there is no block element", () => {
		expect(
			isFirstChildInBlock(createElement("strong"), createElement("div")),
		).toBe(false);
	});

	it("returns true for first child in block", () => {
		const editor = createElement("div", "<p><strong>Text</strong></p>");
		expect(isFirstChildInBlock(getByText(editor, "Text"), editor)).toBe(true);
	});

	it("returns false for not first child in block", () => {
		const editor = createElement(
			"div",
			"<p>This is some <strong>text</strong></p>",
		);
		expect(isFirstChildInBlock(getByText(editor, "text"), editor)).toBe(false);
	});
});

describe("hasContentBefore", () => {
	it("returns false where the node is the first node", () => {
		const div = createElement("div", "<p><strong>Text</strong></p>");
		expect(hasContentBefore(getByText(div, "Text"))).toBe(false);
	});

	it("returns false when the only text node before is a ZWS", () => {
		const div = createElement("div", `<p>${ZWS}<strong>Text</strong></p>`);
		expect(hasContentBefore(getByText(div, "Text"))).toBe(false);
	});

	it("returns true when there is text before the node", () => {
		const div = createElement("div", `<p>Before <strong>Text</strong></p>`);
		expect(hasContentBefore(getByText(div, "Text"))).toBe(true);
	});

	it("returns true when there is another inline element before", () => {
		const div = createElement(
			"div",
			`<p><strong>Before</strong><em>Text</em></p>`,
		);
		expect(hasContentBefore(getByText(div, "Text"))).toBe(true);
	});
});
