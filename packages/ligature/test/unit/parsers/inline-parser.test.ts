import { parseInlinePatterns } from "../../../src/parsers/inline-parser";

describe("parseInlinePatterns", () => {
	describe("Plain text", () => {
		it("handles plain text without markers", () => {
			expect(parseInlinePatterns("Hello, world!")).toEqual([
				{ type: "text", value: "Hello, world!" },
			]);
		});

		it("handles empty strings", () => {
			expect(parseInlinePatterns("")).toEqual([{ type: "text", value: "" }]);
		});

		it("handles whitespace-only strings", () => {
			expect(parseInlinePatterns("   ")).toEqual([
				{ type: "text", value: "   " },
			]);
		});
	});

	describe("Emphasis (*)", () => {
		it("parses single emphasis", () => {
			expect(parseInlinePatterns("Hello, *world!*")).toEqual([
				{ type: "text", value: "Hello, " },
				{ type: "emphasis", children: [{ type: "text", value: "world!" }] },
			]);
		});

		it("parses multiple emphasis in one line", () => {
			expect(parseInlinePatterns("Hello, *world!* and *everyone!*")).toEqual([
				{ type: "text", value: "Hello, " },
				{ type: "emphasis", children: [{ type: "text", value: "world!" }] },
				{ type: "text", value: " and " },
				{ type: "emphasis", children: [{ type: "text", value: "everyone!" }] },
			]);
		});

		it("handles emphasis with punctuation", () => {
			expect(parseInlinePatterns("Is this *cool*?")).toEqual([
				{ type: "text", value: "Is this " },
				{ type: "emphasis", children: [{ type: "text", value: "cool" }] },
				{ type: "text", value: "?" },
			]);
		});

		it("does not match unclosed emphasis", () => {
			expect(parseInlinePatterns("*incomplete italic")).toEqual([
				{ type: "text", value: "*incomplete italic" },
			]);
		});

		it("does not match emphasis with whitespace-only content", () => {
			expect(parseInlinePatterns("*   *")).toEqual([
				{ type: "text", value: "*   *" },
			]);
		});

		it("handles emphasis with newlines inside", () => {
			expect(parseInlinePatterns("*hello\nworld*")).toEqual([
				{
					type: "emphasis",
					children: [{ type: "text", value: "hello\nworld" }],
				},
			]);
		});
	});

	describe("Emphasis (_)", () => {
		it("parses underscore emphasis", () => {
			expect(parseInlinePatterns("Hello, _world!_")).toEqual([
				{ type: "text", value: "Hello, " },
				{ type: "emphasis", children: [{ type: "text", value: "world!" }] },
			]);
		});

		it("does not match underscores inside words", () => {
			expect(parseInlinePatterns("hello_world_again")).toEqual([
				{ type: "text", value: "hello_world_again" },
			]);
		});

		it("matches underscores at word boundaries", () => {
			expect(parseInlinePatterns("hello _world_ again")).toEqual([
				{ type: "text", value: "hello " },
				{ type: "emphasis", children: [{ type: "text", value: "world" }] },
				{ type: "text", value: " again" },
			]);
		});
	});

	describe("Strong (**)", () => {
		it("parses single strong", () => {
			expect(parseInlinePatterns("Hello, **world**!")).toEqual([
				{ type: "text", value: "Hello, " },
				{ type: "strong", children: [{ type: "text", value: "world" }] },
				{ type: "text", value: "!" },
			]);
		});

		it("parses multiple strong in one line", () => {
			expect(
				parseInlinePatterns("Hello, **world**! and **everyone**!"),
			).toEqual([
				{ type: "text", value: "Hello, " },
				{ type: "strong", children: [{ type: "text", value: "world" }] },
				{ type: "text", value: "! and " },
				{ type: "strong", children: [{ type: "text", value: "everyone" }] },
				{ type: "text", value: "!" },
			]);
		});

		it("does not match incomplete strong", () => {
			expect(parseInlinePatterns("**incomplete bold*")).toEqual([
				{ type: "text", value: "**incomplete bold*" },
			]);
		});

		it("does not match strong with whitespace-only content", () => {
			expect(parseInlinePatterns("**  **")).toEqual([
				{ type: "text", value: "**  **" },
			]);
		});
	});

	describe("Strong (__)", () => {
		it("parses underscore strong", () => {
			expect(parseInlinePatterns("Hello, __world__!")).toEqual([
				{ type: "text", value: "Hello, " },
				{ type: "strong", children: [{ type: "text", value: "world" }] },
				{ type: "text", value: "!" },
			]);
		});
	});

	describe("Nested formatting", () => {
		it("parses emphasis inside strong", () => {
			expect(parseInlinePatterns("Hello, **world *inside*!**")).toEqual([
				{ type: "text", value: "Hello, " },
				{
					type: "strong",
					children: [
						{ type: "text", value: "world " },
						{ type: "emphasis", children: [{ type: "text", value: "inside" }] },
						{ type: "text", value: "!" },
					],
				},
			]);
		});

		it("parses strong inside emphasis", () => {
			expect(parseInlinePatterns("*Hello **world**!*")).toEqual([
				{
					type: "emphasis",
					children: [
						{ type: "text", value: "Hello " },
						{ type: "strong", children: [{ type: "text", value: "world" }] },
						{ type: "text", value: "!" },
					],
				},
			]);
		});

		it("handles adjacent but separate formatting", () => {
			expect(parseInlinePatterns("**bold** and *italic*")).toEqual([
				{ type: "strong", children: [{ type: "text", value: "bold" }] },
				{ type: "text", value: " and " },
				{ type: "emphasis", children: [{ type: "text", value: "italic" }] },
			]);
		});

		it("handles strong markers inside emphasis", () => {
			expect(parseInlinePatterns("*b**b**b*")).toEqual([
				{
					type: "emphasis",
					children: [
						{ type: "text", value: "b" },
						{ type: "strong", children: [{ type: "text", value: "b" }] },
						{ type: "text", value: "b" },
					],
				},
			]);
		});

		it("handles partial overlap at end", () => {
			expect(parseInlinePatterns("*b**b*")).toEqual([
				{
					type: "emphasis",
					children: [{ type: "text", value: "b**b" }],
				},
			]);
		});
	});

	describe("Triple markers (***)", () => {
		it("parses triple asterisks as nested strong+emphasis", () => {
			expect(parseInlinePatterns("***triple***")).toEqual([
				{
					type: "strong",
					children: [
						{ type: "emphasis", children: [{ type: "text", value: "triple" }] },
					],
				},
			]);
		});

		it("parses triple underscores as nested strong+emphasis", () => {
			expect(parseInlinePatterns("___triple___")).toEqual([
				{
					type: "strong",
					children: [
						{ type: "emphasis", children: [{ type: "text", value: "triple" }] },
					],
				},
			]);
		});

		it("handles mixed triple and double markers", () => {
			expect(
				parseInlinePatterns("This is a sentence with **bold *italics* **in it"),
			).toEqual([
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
			]);
		});
	});

	describe("Strikethrough (~~)", () => {
		it("parses basic strikethrough", () => {
			expect(parseInlinePatterns("This is ~~crossed~~ out")).toEqual([
				{ type: "text", value: "This is " },
				{
					type: "strikethrough",
					children: [{ type: "text", value: "crossed" }],
				},
				{ type: "text", value: " out" },
			]);
		});

		it("parses strong inside strikethrough", () => {
			expect(parseInlinePatterns("~~**bold**~~")).toEqual([
				{
					type: "strikethrough",
					children: [
						{ type: "strong", children: [{ type: "text", value: "bold" }] },
					],
				},
			]);
		});

		it("parses strikethrough inside strong", () => {
			expect(parseInlinePatterns("**~~strike~~**")).toEqual([
				{
					type: "strong",
					children: [
						{
							type: "strikethrough",
							children: [{ type: "text", value: "strike" }],
						},
					],
				},
			]);
		});
	});

	describe("Code (`)", () => {
		it("parses inline code", () => {
			expect(parseInlinePatterns("Use `console.log()` to debug")).toEqual([
				{ type: "text", value: "Use " },
				{ type: "code", value: "console.log()" },
				{ type: "text", value: " to debug" },
			]);
		});

		it("parses multiple code spans", () => {
			expect(parseInlinePatterns("`foo` and `bar`")).toEqual([
				{ type: "code", value: "foo" },
				{ type: "text", value: " and " },
				{ type: "code", value: "bar" },
			]);
		});

		it("preserves formatting markers inside code", () => {
			expect(parseInlinePatterns("`**not bold**`")).toEqual([
				{ type: "code", value: "**not bold**" },
			]);
		});

		it("ignores other formatting inside code spans", () => {
			expect(parseInlinePatterns("`*not* **emphasized**`")).toEqual([
				{ type: "code", value: "*not* **emphasized**" },
			]);
		});

		it("handles code span with spaces", () => {
			expect(parseInlinePatterns("`  spaces  `")).toEqual([
				{ type: "code", value: "  spaces  " },
			]);
		});

		it("does not parse unclosed code", () => {
			expect(parseInlinePatterns("`unclosed code")).toEqual([
				{ type: "text", value: "`unclosed code" },
			]);
		});
	});

	describe("Edge cases with runs", () => {
		it("treats 4+ asterisk runs as literal text", () => {
			expect(parseInlinePatterns("****bold****")).toEqual([
				{ type: "text", value: "****bold****" },
			]);
		});

		it("treats 5+ asterisk runs as literal text", () => {
			expect(parseInlinePatterns("*****deded*****")).toEqual([
				{ type: "text", value: "*****deded*****" },
			]);
		});

		it("treats 4+ underscore runs as literal text", () => {
			expect(parseInlinePatterns("____text____")).toEqual([
				{ type: "text", value: "____text____" },
			]);
		});
	});

	describe("Mixed markers", () => {
		it("handles asterisk emphasis with underscore strong", () => {
			expect(parseInlinePatterns("*italic* and __bold__")).toEqual([
				{ type: "emphasis", children: [{ type: "text", value: "italic" }] },
				{ type: "text", value: " and " },
				{ type: "strong", children: [{ type: "text", value: "bold" }] },
			]);
		});

		it("handles underscore emphasis with asterisk strong", () => {
			expect(parseInlinePatterns("_italic_ and **bold**")).toEqual([
				{ type: "emphasis", children: [{ type: "text", value: "italic" }] },
				{ type: "text", value: " and " },
				{ type: "strong", children: [{ type: "text", value: "bold" }] },
			]);
		});

		it("does not cross-match different marker types", () => {
			expect(parseInlinePatterns("*not closed_")).toEqual([
				{ type: "text", value: "*not closed_" },
			]);
		});
	});

	describe("Complex real-world examples", () => {
		it("handles a sentence with multiple formatting types", () => {
			expect(
				parseInlinePatterns(
					"This has **bold**, *italic*, ~~strikethrough~~, and `code`!",
				),
			).toEqual([
				{ type: "text", value: "This has " },
				{ type: "strong", children: [{ type: "text", value: "bold" }] },
				{ type: "text", value: ", " },
				{ type: "emphasis", children: [{ type: "text", value: "italic" }] },
				{ type: "text", value: ", " },
				{
					type: "strikethrough",
					children: [{ type: "text", value: "strikethrough" }],
				},
				{ type: "text", value: ", and " },
				{ type: "code", value: "code" },
				{ type: "text", value: "!" },
			]);
		});

		it("handles deeply nested formatting", () => {
			expect(parseInlinePatterns("**bold *italic ~~strike~~***")).toEqual([
				{
					children: [
						{
							type: "text",
							value: "bold *italic ",
						},
						{
							children: [
								{
									type: "text",
									value: "strike",
								},
							],
							type: "strikethrough",
						},
					],
					type: "strong",
				},
				{
					type: "text",
					value: "*",
				},
			]);
		});

		it("handles formatting at start and end of string", () => {
			expect(parseInlinePatterns("**start** middle *end*")).toEqual([
				{ type: "strong", children: [{ type: "text", value: "start" }] },
				{ type: "text", value: " middle " },
				{ type: "emphasis", children: [{ type: "text", value: "end" }] },
			]);
		});

		it("handles back-to-back formatted spans", () => {
			expect(parseInlinePatterns("**bold***italic*")).toEqual([
				{ type: "strong", children: [{ type: "text", value: "bold" }] },
				{ type: "emphasis", children: [{ type: "text", value: "italic" }] },
			]);
		});
	});
});
