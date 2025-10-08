import { serializeToMarkdown } from "../../../src/parsers/serializer";

const createEditor = (innerHTML = ""): HTMLElement => {
	const editor = document.createElement("div");
	editor.innerHTML = innerHTML.trim();
	return editor;
};

describe("serializeToMarkdown", () => {
	it("serializes plain text", () => {
		const node = createEditor("Hello, world!");
		expect(serializeToMarkdown(node)).toBe("Hello, world!");
	});

	describe("headings", () => {
		it.each([
			["<h1>Heading 1</h1>", "# Heading 1\n"],
			["<h2>Heading 2</h2>", "## Heading 2\n"],
			["<h6>Heading 6</h6>", "###### Heading 6\n"],
		])("handles %s", (input, expected) => {
			const node = createEditor(input);
			expect(serializeToMarkdown(node)).toBe(expected);
		});
	});

	describe("lists", () => {
		it("handles unordered lists", () => {
			const node = createEditor("<ul><li>Item 1</li><li>Item 2</li></ul>");
			expect(serializeToMarkdown(node)).toBe("- Item 1\n- Item 2\n");
		});

		it("handles ordered lists", () => {
			const node = createEditor("<ol><li>Item 1</li><li>Item 2</li></ol>");
			expect(serializeToMarkdown(node)).toBe("1. Item 1\n2. Item 2\n");
		});

		it("respects start attribute on ordered lists", () => {
			const node = createEditor(
				"<ol start='3'><li>Item A</li><li>Item B</li></ol>",
			);
			expect(serializeToMarkdown(node)).toBe("3. Item A\n4. Item B\n");
		});

		it("serializes standalone <li>", () => {
			const node = createEditor("<li>Loose item</li>");
			expect(serializeToMarkdown(node)).toBe("- Loose item");
		});

		it("handles nested formatting inside list items", () => {
			const node = createEditor(
				"<ul><li><strong>Bold</strong> and <em>italic</em></li></ul>",
			);
			expect(serializeToMarkdown(node)).toBe("- **Bold** and _italic_\n");
		});
	});

	describe("inline formatting", () => {
		it.each([
			["<strong>bold</strong>", "**bold**\n"],
			["<b>bold</b>", "**bold**\n"],
			["<em>italic</em>", "_italic_\n"],
			["<i>italic</i>", "_italic_\n"],
			["<s>strike</s>", "~~strike~~\n"],
			["<del>strike</del>", "~~strike~~\n"],
		])("renders %s", (input, expected) => {
			const node = createEditor(input);
			expect(serializeToMarkdown(node)).toBe(expected);
		});

		it("handles nested inline formatting", () => {
			const node = createEditor("<strong>very <em>fancy</em></strong>");
			expect(serializeToMarkdown(node)).toBe("**very _fancy_**\n");
		});
	});

	describe("special cases", () => {
		it("strips zero-width spaces and non-breaking spaces", () => {
			const node = createEditor("Hello\u200B\u00a0World");
			expect(serializeToMarkdown(node)).toBe("Hello World");
		});

		it("renders <hr>", () => {
			const node = createEditor("<hr>");
			expect(serializeToMarkdown(node)).toBe("----\n");
		});

		it("handles paragraphs with text", () => {
			const node = createEditor("<p>This is a paragraph.</p>");
			expect(serializeToMarkdown(node)).toBe("This is a paragraph.\n");
		});

		it("handles mixed blocks", () => {
			const node = createEditor(`
				<h2>Heading</h2>
				<p>Paragraph with <em>emphasis</em>.</p>
				<ul><li>List A</li><li>List B</li></ul>
				<hr>
			`);
			expect(serializeToMarkdown(node)).toBe(
				"## Heading\n\nParagraph with _emphasis_.\n\n- List A\n- List B\n\n----\n",
			);
		});

		it("handles empty container", () => {
			const node = createEditor("");
			expect(serializeToMarkdown(node)).toBe("");
		});
	});
});
