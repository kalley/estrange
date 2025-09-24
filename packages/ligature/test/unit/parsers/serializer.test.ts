import {
	inlineNodeToMarkdown,
	serializeToMarkdown,
} from "../../../src/parsers/serializer";

const createEditor = (innerHTML = "") => {
	const editor = document.createElement("div");
	editor.innerHTML = innerHTML;
	return editor;
};

describe("serializeToMarkdown", () => {
	it.each([
		["Hello, world!", "Hello, world!"],
		["<ul><li>Item 1</li><li>Item 2</li></ul>", "- Item 1\n- Item 2"],
		["<p>This is a paragraph.</p>", "This is a paragraph."],
		["<ol><li>Item 1</li><li>Item 2</li></ol>", "1. Item 1\n2. Item 2"],
		[
			"<ol start='2'><li>Item 1</li><li>Item 2</li></ol>",
			"2. Item 1\n3. Item 2",
		],
		[
			"<h1>Title</h1>This is a <strong>bold</strong> sentence.",
			"# Title\nThis is a \n**bold**\n sentence.",
		],
	])("should parse '%s' to '%s'", (input, expected) => {
		const node = createEditor(input);
		expect(serializeToMarkdown(node)).toBe(expected);
	});
});

describe("inlineNodeToMarkdown", () => {
	it.each([
		[
			"This is a <strong>bold</strong> sentence.",
			"This is a **bold** sentence.",
		],
		["<em>italic</em>", "*italic*"],
		["<s>strikethrough</s>", "~~strikethrough~~"],
	])("should parse '%s' to '%s'", (input, expected) => {
		const node = createEditor(input);
		expect(inlineNodeToMarkdown(node)).toBe(expected);
	});
});
