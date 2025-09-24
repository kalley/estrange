import { parseInlinePatterns } from "../../../src/parsers/inline-parser";

describe("parseInlinePatterns", () => {
	const cases = [
		{
			input: "Hello, world!",
			expected: [{ type: "text", value: "Hello, world!" }],
		},
		{
			input: "Hello, *world!*",
			expected: [
				{ type: "text", value: "Hello, " },
				{
					children: [{ type: "text", value: "world!" }],
					type: "emphasis",
				},
			],
		},
		{
			input: "Hello, *world!* and *everyone!*",
			expected: [
				{ type: "text", value: "Hello, " },
				{
					children: [{ type: "text", value: "world!" }],
					type: "emphasis",
				},
				{ type: "text", value: " and " },
				{
					children: [{ type: "text", value: "everyone!" }],
					type: "emphasis",
				},
			],
		},
		{
			input: "Hello, *world!* and *everyone!*",
			expected: [
				{ type: "text", value: "Hello, " },
				{
					children: [{ type: "text", value: "world!" }],
					type: "emphasis",
				},
				{ type: "text", value: " and " },
				{
					children: [{ type: "text", value: "everyone!" }],
					type: "emphasis",
				},
			],
		},
		{
			input: "Hello, **world**!",
			expected: [
				{ type: "text", value: "Hello, " },
				{
					children: [{ type: "text", value: "world" }],
					type: "strong",
				},
				{ type: "text", value: "!" },
			],
		},
		{
			input: "Hello, **world**! and **everyone**!",
			expected: [
				{ type: "text", value: "Hello, " },
				{
					children: [{ type: "text", value: "world" }],
					type: "strong",
				},
				{ type: "text", value: "! and " },
				{
					children: [{ type: "text", value: "everyone" }],
					type: "strong",
				},
				{ type: "text", value: "!" },
			],
		},
		{
			input: "Hello, **world *inside*!**",
			expected: [
				{ type: "text", value: "Hello, " },
				{
					children: [
						{ type: "text", value: "world " },
						{
							children: [{ type: "text", value: "inside" }],
							type: "emphasis",
						},
						{ type: "text", value: "!" },
					],
					type: "strong",
				},
			],
		},
		{
			input: "**incomplete bold*",
			expected: [{ type: "text", value: "**incomplete bold*" }],
		},
		{
			input: "**bold** and *italic*",
			expected: [
				{ type: "strong", children: [{ type: "text", value: "bold" }] },
				{ type: "text", value: " and " },
				{
					children: [{ type: "text", value: "italic" }],
					type: "emphasis",
				},
			],
		},
		{
			input: "***triple***",
			expected: [
				{
					type: "strong",
					children: [
						{ type: "emphasis", children: [{ type: "text", value: "triple" }] },
					],
				},
			],
		},
		{
			input: "*****deded*****",
			expected: [{ value: "*****deded*****", type: "text" }],
		},
		// whitespace-only inner content should NOT match
		{ input: "**  **", expected: [{ type: "text", value: "**  **" }] },
		{ input: "*   *", expected: [{ type: "text", value: "*   *" }] },

		// single unclosed markers should not match
		{
			input: "*incomplete italic",
			expected: [{ type: "text", value: "*incomplete italic" }],
		},

		// underscores inside words — current behavior: WILL match (decide if you want this)
		{
			input: "hello_world_again",
			expected: [{ type: "text", value: "hello_world_again" }],
		},

		// strikethrough basic
		{
			input: "This is ~~crossed~~ out",
			expected: [
				{ type: "text", value: "This is " },
				{
					type: "strikethrough",
					children: [{ type: "text", value: "crossed" }],
				},
				{ type: "text", value: " out" },
			],
		},

		// nested: outer then inner (parser should need two passes)
		{
			input: "~~**bold**~~",
			expected: [
				{
					children: [
						{
							children: [{ type: "text", value: "bold" }],
							type: "strong",
						},
					],
					type: "strikethrough",
				},
			],
		},
		{
			input: "**~~strike~~**",
			expected: [
				{
					children: [
						{
							children: [{ type: "text", value: "strike" }],
							type: "strikethrough",
						},
					],
					type: "strong",
				},
			],
		},

		// newline inside markers
		{
			input: "*hello\nworld*",
			expected: [
				{
					children: [{ type: "text", value: "hello\nworld" }],
					type: "emphasis",
				},
			],
		},

		// punctuation adjacency
		{
			input: "Is this *cool*?",
			expected: [
				{ type: "text", value: "Is this " },
				{
					children: [{ type: "text", value: "cool" }],
					type: "emphasis",
				},
				{ type: "text", value: "?" },
			],
		},

		// 4+ runs should be treated as literal (skip rule)
		{
			input: "****bold****",
			expected: [{ type: "text", value: "****bold****" }],
		},
		{
			input: "*b**b**b*",
			expected: [
				{
					children: [{ type: "text", value: "b**b**b" }],
					type: "emphasis",
				},
			],
		},
		{
			input: "*b**b*",
			expected: [
				{
					children: [{ type: "text", value: "b**b" }],
					type: "emphasis",
				},
			],
		},
		{
			input: "This is a sentence with **bold *italics* **in it",
			expected: [
				{ type: "text", value: "This is a sentence with " },
				{
					type: "strong",
					children: [
						{ type: "text", value: "bold " },
						{
							type: "emphasis",
							children: [{ type: "text", value: "italics" }],
						},
						{ type: "text", value: " " },
					],
				},
				{ type: "text", value: "in it" },
			],
		},
	];
	it.each(cases)("parses $input", ({ input, expected }) => {
		const result = parseInlinePatterns(input);
		expect(result).toEqual(expected);
	});
});
