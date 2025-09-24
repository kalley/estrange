import { ZWS } from "../../../src/dom/zw-manager";
import { parseBlockMarkdown } from "../../../src/parsers/block-parser";

describe("parseBlockMarkdown", () => {
	it.each([
		{ input: "Hello, world!", expected: null },
		{
			input: "# This is a title",
			expected: {
				type: "heading",
				level: 1,
				content: "This is a title",
			},
		},
		{
			input: "# This is a _title_",
			expected: {
				type: "heading",
				level: 1,
				content: "This is a _title_",
			},
		},
		{
			input: "- This is a list item",
			expected: {
				type: "ul",
				content: "This is a list item",
			},
		},
		{
			input: "1. This is a list item",
			expected: {
				type: "ol",
				content: "This is a list item",
				start: 1,
			},
		},
		{
			input: "3. This is a list item",
			expected: {
				type: "ol",
				content: "This is a list item",
				start: 3,
			},
		}, // Empty/whitespace content
		{ input: "#", expected: null },
		{ input: "# ", expected: { type: "heading", level: 1, content: ZWS } },
		{ input: "#     ", expected: { type: "heading", level: 1, content: ZWS } },

		// Maximum heading level
		{
			input: "###### Level 6",
			expected: { type: "heading", level: 6, content: "Level 6" },
		},
		{ input: "####### Too many", expected: null }, // Should this be invalid?

		// Alternative list markers
		{
			input: "* Alternative bullet",
			expected: { type: "ul", content: "Alternative bullet" },
		},

		// Edge cases for numbered lists
		{
			input: "0. Zero start",
			expected: { type: "ol", content: "Zero start", start: 0 },
		},
		{
			input: "999. Large number",
			expected: { type: "ol", content: "Large number", start: 999 },
		},

		// Invalid patterns
		{ input: "#No space", expected: null },
		{ input: "1.No space", expected: null },
		{ input: "-No space", expected: null },
		// Leading/trailing whitespace
		{
			input: "  # Heading with leading spaces",
			expected: {
				content: "Heading with leading spaces",
				level: 1,
				type: "heading",
			},
		},
		{
			input: "# Trailing spaces  ",
			expected: { type: "heading", level: 1, content: "Trailing spaces" },
		},
		{
			input: "*\t*\t*\t",
			expected: { type: "hr" },
		},
	])("should parse $input", ({ input, expected }) => {
		const result = parseBlockMarkdown(input);
		expect(result).toEqual(expected);
	});
});
