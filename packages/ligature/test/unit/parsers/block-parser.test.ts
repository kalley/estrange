import { ZWS } from "../../../src/dom/zw-utils";
import { parseBlockMarkdown } from "../../../src/parsers/block-parser";

describe("parseBlockMarkdown", () => {
	describe("Basic block parsing", () => {
		it.each([
			{
				input: "Hello, world!",
				expected: { type: "p", content: "Hello, world!" },
			},
			{
				input: "# Heading",
				expected: { type: "heading", level: 1, content: "Heading" },
			},
			{
				input: "- List item",
				expected: { type: "ul", content: "List item" },
			},
			{
				input: "1. List item",
				expected: { type: "ol", content: "List item", start: 1 },
			},
			{
				input: "***",
				expected: { type: "hr" },
			},
		])("parses: $input", ({ input, expected }) => {
			expect(parseBlockMarkdown(input)).toEqual(expected);
		});
	});

	describe("Headings", () => {
		it.each([
			{ input: "# H1", level: 1 },
			{ input: "## H2", level: 2 },
			{ input: "### H3", level: 3 },
			{ input: "###### H6", level: 6 },
		])("parses level $level heading", ({ input, level }) => {
			expect(parseBlockMarkdown(input)).toEqual({
				type: "heading",
				level,
				content: input.replace(/^#+\s*/, ""),
			});
		});

		it("strips trailing hashes and whitespace", () => {
			expect(parseBlockMarkdown("# Title ###   ")).toEqual({
				type: "heading",
				level: 1,
				content: "Title",
			});
		});

		it("falls back when heading syntax is invalid", () => {
			expect(parseBlockMarkdown("####### Too many")).toEqual({
				type: "p",
				content: "####### Too many",
			});
			expect(parseBlockMarkdown("#No space")).toEqual({
				type: "p",
				content: "#No space",
			});
		});
	});

	describe("Lists", () => {
		it("parses unordered lists", () => {
			expect(parseBlockMarkdown("* Item")).toEqual({
				type: "ul",
				content: "Item",
			});
		});

		it("parses ordered lists with period or paren", () => {
			expect(parseBlockMarkdown("3. Item")).toEqual({
				type: "ol",
				content: "Item",
				start: 3,
			});
			expect(parseBlockMarkdown("3) Item")).toEqual({
				type: "ol",
				content: "Item",
				start: 3,
			});
		});
	});

	describe("Horizontal rules", () => {
		it.each([
			"***",
			"---",
			"___",
			"* * *",
			"-----",
		])("parses hr: %s", (input) => {
			expect(parseBlockMarkdown(input)).toEqual({ type: "hr" });
		});

		it("does not match mixed characters", () => {
			expect(parseBlockMarkdown("*-*")).toEqual({
				type: "p",
				content: "*-*",
			});
		});
	});

	describe("Paragraph fallback", () => {
		it.each([
			"Just text",
			"1.No space",
			"-No space",
			"123",
			"これは段落です",
		])("returns paragraph for: %s", (input) => {
			expect(parseBlockMarkdown(input)).toEqual({
				type: "p",
				content: input,
			});
		});
	});

	describe("Whitespace and empty input", () => {
		it.each([
			"",
			"   ",
			"\t",
			"\n",
			" \t \n ",
		])("returns null for whitespace-only input", (input) => {
			expect(parseBlockMarkdown(input)).toBeNull();
		});
	});

	describe("Zero-width space handling", () => {
		it("strips ZWS when mixed with content", () => {
			expect(parseBlockMarkdown(`# Title${ZWS}More`)).toEqual({
				type: "heading",
				level: 1,
				content: "TitleMore",
			});
		});

		it("treats ZWS-only input as empty", () => {
			expect(parseBlockMarkdown(ZWS)).toBeNull();
		});
	});

	describe("Type shape", () => {
		it("returns correctly shaped block objects", () => {
			const block = parseBlockMarkdown("# Test");

			if (block?.type === "heading") {
				expect(block.level).toBe(1);
				expect(typeof block.content).toBe("string");
			}
		});
	});
});
