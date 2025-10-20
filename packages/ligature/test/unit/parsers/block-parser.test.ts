import { ZWS } from "../../../src/dom/zw-utils";
import { parseBlockMarkdown } from "../../../src/parsers/block-parser";

describe("parseBlockMarkdown", () => {
	describe("Basic functionality", () => {
		it.each([
			{
				input: "Hello, world!",
				expected: { type: "p", content: "Hello, world!" },
			},
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
		])("should parse basic $expected.type: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});
	});

	describe("Headings", () => {
		it.each([
			// All heading levels
			{
				input: "# Level 1",
				expected: { type: "heading", level: 1, content: "Level 1" },
			},
			{
				input: "## Level 2",
				expected: { type: "heading", level: 2, content: "Level 2" },
			},
			{
				input: "### Level 3",
				expected: { type: "heading", level: 3, content: "Level 3" },
			},
			{
				input: "#### Level 4",
				expected: { type: "heading", level: 4, content: "Level 4" },
			},
			{
				input: "##### Level 5",
				expected: { type: "heading", level: 5, content: "Level 5" },
			},
			{
				input: "###### Level 6",
				expected: { type: "heading", level: 6, content: "Level 6" },
			},

			// Invalid heading levels (7+ hashes)
			{
				input: "####### Too many",
				expected: { type: "p", content: "####### Too many" },
			},
			{
				input: "######## Way too many",
				expected: { type: "p", content: "######## Way too many" },
			},

			// Empty/whitespace content
			{ input: "#", expected: { type: "p", content: "#" } },
			{ input: "# ", expected: { type: "p", content: "#" } },
			{ input: "#     ", expected: { type: "p", content: "#" } },
			{ input: "##", expected: { type: "p", content: "##" } },
			{ input: "## ", expected: { type: "p", content: "##" } },

			// Trailing hashes (should be stripped)
			{
				input: "# Title #",
				expected: { type: "heading", level: 1, content: "Title" },
			},
			{
				input: "# Title ###",
				expected: { type: "heading", level: 1, content: "Title" },
			},
			{
				input: "## Title with spaces ##   ",
				expected: { type: "heading", level: 2, content: "Title with spaces" },
			},

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
				input: "\t## Tab-indented heading",
				expected: {
					type: "heading",
					level: 2,
					content: "Tab-indented heading",
				},
			},
			{
				input: "# Trailing spaces  ",
				expected: { type: "heading", level: 1, content: "Trailing spaces" },
			},

			// Invalid patterns (no space after #)
			{ input: "#No space", expected: { type: "p", content: "#No space" } },
			{ input: "##No space", expected: { type: "p", content: "##No space" } },

			// Special characters in heading content
			{
				input: "# Heading with $pecial ch@rs!",
				expected: {
					type: "heading",
					level: 1,
					content: "Heading with $pecial ch@rs!",
				},
			},
			{
				input: "# 日本語のタイトル",
				expected: { type: "heading", level: 1, content: "日本語のタイトル" },
			},
		])("should handle heading case: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});
	});

	describe("Horizontal rules", () => {
		it.each([
			// Basic patterns
			{ input: "***", expected: { type: "hr" } },
			{ input: "---", expected: { type: "hr" } },
			{ input: "___", expected: { type: "hr" } },

			// With whitespace
			{ input: "* * *", expected: { type: "hr" } },
			{ input: "- - -", expected: { type: "hr" } },
			{ input: "_ _ _", expected: { type: "hr" } },
			{ input: "*  *  *", expected: { type: "hr" } },
			{ input: "-  -  -", expected: { type: "hr" } },
			{ input: "_  _  _", expected: { type: "hr" } },

			// More than 3 characters
			{ input: "****", expected: { type: "hr" } },
			{ input: "-----", expected: { type: "hr" } },
			{ input: "_____", expected: { type: "hr" } },
			{ input: "* * * * *", expected: { type: "hr" } },

			// Leading/trailing whitespace
			{ input: "  ***  ", expected: { type: "hr" } },
			{ input: "\t---\t", expected: { type: "hr" } },
			{ input: "*\t*\t*\t", expected: { type: "hr" } },

			// Invalid patterns (less than 3)
			{ input: "*", expected: { type: "p", content: "*" } },
			{ input: "**", expected: { type: "p", content: "**" } },
			{ input: "--", expected: { type: "p", content: "--" } },

			// Mixed characters (should not match)
			{ input: "*-*", expected: { type: "p", content: "*-*" } },
			{ input: "***---", expected: { type: "p", content: "***---" } },
		])("should handle horizontal rule: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});
	});

	describe("Unordered lists", () => {
		it.each([
			// Basic patterns
			{
				input: "- List item",
				expected: { type: "ul", content: "List item" },
			},
			{
				input: "* Alternative bullet",
				expected: { type: "ul", content: "Alternative bullet" },
			},
			{
				input: "+ Plus bullet",
				expected: { type: "ul", content: "Plus bullet" },
			},

			// Empty content
			{ input: "- ", expected: { type: "p", content: "-" } },
			{ input: "* ", expected: { type: "p", content: "*" } },
			{ input: "+ ", expected: { type: "p", content: "+" } },

			// Leading/trailing whitespace
			{
				input: "  - Indented item",
				expected: { type: "ul", content: "Indented item" },
			},
			{
				input: "\t* Tab-indented item",
				expected: { type: "ul", content: "Tab-indented item" },
			},
			{
				input: "- Item with trailing spaces  ",
				expected: { type: "ul", content: "Item with trailing spaces" },
			},

			// Multiple spaces after marker
			{
				input: "-   Multiple spaces",
				expected: { type: "ul", content: "Multiple spaces" },
			},
			{
				input: "*\t\tTab after marker",
				expected: { type: "ul", content: "Tab after marker" },
			},

			// Invalid patterns (no space after marker)
			{ input: "-No space", expected: { type: "p", content: "-No space" } },
			{ input: "*No space", expected: { type: "p", content: "*No space" } },
			{ input: "+No space", expected: { type: "p", content: "+No space" } },

			// Special characters in content
			{
				input: "- Item with $pecial ch@rs!",
				expected: { type: "ul", content: "Item with $pecial ch@rs!" },
			},
			{
				input: "* 日本語のアイテム",
				expected: { type: "ul", content: "日本語のアイテム" },
			},
		])("should handle unordered list: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});
	});

	describe("Ordered lists", () => {
		it.each([
			// Basic patterns with periods
			{
				input: "1. First item",
				expected: { type: "ol", content: "First item", start: 1 },
			},
			{
				input: "3. Third item",
				expected: { type: "ol", content: "Third item", start: 3 },
			},
			{
				input: "999. Large number",
				expected: { type: "ol", content: "Large number", start: 999 },
			},

			// Basic patterns with parentheses
			{
				input: "1) First item",
				expected: { type: "ol", content: "First item", start: 1 },
			},
			{
				input: "3) Third item",
				expected: { type: "ol", content: "Third item", start: 3 },
			},
			{
				input: "999) Large number",
				expected: { type: "ol", content: "Large number", start: 999 },
			},

			// Edge case numbers
			{
				input: "0. Zero start",
				expected: { type: "ol", content: "Zero start", start: 0 },
			},
			{
				input: "0) Zero start paren",
				expected: { type: "ol", content: "Zero start paren", start: 0 },
			},

			// Empty content
			{ input: "1. ", expected: { type: "p", content: "1." } },
			{ input: "1) ", expected: { type: "p", content: "1)" } },

			// Leading/trailing whitespace
			{
				input: "  1. Indented item",
				expected: { type: "ol", content: "Indented item", start: 1 },
			},
			{
				input: "\t2) Tab-indented item",
				expected: { type: "ol", content: "Tab-indented item", start: 2 },
			},
			{
				input: "1. Item with trailing spaces  ",
				expected: {
					type: "ol",
					content: "Item with trailing spaces",
					start: 1,
				},
			},

			// Multiple spaces after marker
			{
				input: "1.   Multiple spaces",
				expected: { type: "ol", content: "Multiple spaces", start: 1 },
			},
			{
				input: "1)\t\tTab after marker",
				expected: { type: "ol", content: "Tab after marker", start: 1 },
			},

			// Invalid patterns (no space after marker)
			{ input: "1.No space", expected: { type: "p", content: "1.No space" } },
			{ input: "1)No space", expected: { type: "p", content: "1)No space" } },

			// Invalid patterns (non-numeric)
			{ input: "a. Letter", expected: { type: "p", content: "a. Letter" } },
			{ input: "I. Roman", expected: { type: "p", content: "I. Roman" } },

			// Special characters in content
			{
				input: "1. Item with $pecial ch@rs!",
				expected: { type: "ol", content: "Item with $pecial ch@rs!", start: 1 },
			},
			{
				input: "2) 日本語のアイテム",
				expected: { type: "ol", content: "日本語のアイテム", start: 2 },
			},
		])("should handle ordered list: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});
	});

	describe("Paragraphs (fallback)", () => {
		it.each([
			// Basic paragraphs
			{
				input: "Just a regular paragraph",
				expected: { type: "p", content: "Just a regular paragraph" },
			},
			{
				input: "Paragraph with multiple words and punctuation!",
				expected: {
					type: "p",
					content: "Paragraph with multiple words and punctuation!",
				},
			},

			// Failed pattern matches
			{ input: "#No space", expected: { type: "p", content: "#No space" } },
			{ input: "1.No space", expected: { type: "p", content: "1.No space" } },
			{ input: "-No space", expected: { type: "p", content: "-No space" } },
			{
				input: "####### Too many",
				expected: { type: "p", content: "####### Too many" },
			},
			{ input: "**", expected: { type: "p", content: "**" } },
			{ input: "*-*", expected: { type: "p", content: "*-*" } },

			// Numbers/punctuation that don't match patterns
			{ input: "123", expected: { type: "p", content: "123" } },
			{ input: "1.2.3", expected: { type: "p", content: "1.2.3" } },
			{ input: "1...", expected: { type: "p", content: "1..." } },

			// Special characters
			{
				input: "Paragraph with #hashtag and @mention",
				expected: {
					type: "p",
					content: "Paragraph with #hashtag and @mention",
				},
			},
			{
				input: "$100 and 50% off!",
				expected: { type: "p", content: "$100 and 50% off!" },
			},

			// Unicode
			{
				input: "これは段落です",
				expected: { type: "p", content: "これは段落です" },
			},
			{
				input: "Émojis 🎉 and ümlauts",
				expected: { type: "p", content: "Émojis 🎉 and ümlauts" },
			},

			// Leading/trailing whitespace (now stripped)
			{
				input: "  Paragraph with leading spaces",
				expected: { type: "p", content: "Paragraph with leading spaces" },
			},
			{
				input: "Paragraph with trailing spaces  ",
				expected: { type: "p", content: "Paragraph with trailing spaces" },
			},
		])("should handle paragraph: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});
	});

	describe("Edge cases and boundary conditions", () => {
		it("should return null for empty string", () => {
			const result = parseBlockMarkdown("");
			expect(result).toBeNull();
		});

		it("should return null for whitespace-only string", () => {
			const result = parseBlockMarkdown("   ");
			expect(result).toBeNull();
		});

		it("should return null for tab-only string", () => {
			const result = parseBlockMarkdown("\t\t");
			expect(result).toBeNull();
		});

		it("should return null for newline-only string", () => {
			const result = parseBlockMarkdown("\n");
			expect(result).toBeNull();
		});

		it("should return null for mixed whitespace", () => {
			const result = parseBlockMarkdown(" \t \n ");
			expect(result).toBeNull();
		});

		it.each([
			// ZWS handling in various contexts (now stripped consistently)
			{
				input: `# ${ZWS}`,
				expected: { type: "p", content: "#" },
			},
			{
				input: `- ${ZWS}`,
				expected: { type: "p", content: "-" },
			},
			{
				input: `1. ${ZWS}`,
				expected: { type: "p", content: "1." },
			},
			{
				input: ZWS,
				expected: null,
			},

			// ZWS mixed with content (ZWS stripped, content preserved)
			{
				input: `# Title${ZWS}More`,
				expected: { type: "heading", level: 1, content: "TitleMore" },
			},
			{
				input: `${ZWS}# Title`,
				expected: { type: "heading", level: 1, content: "Title" },
			},
		])("should handle ZWS correctly: $input", ({ input, expected }) => {
			const result = parseBlockMarkdown(input);
			expect(result).toEqual(expected);
		});

		it("should handle very long input", () => {
			const longContent = "a".repeat(10000);
			const input = `# ${longContent}`;
			const result = parseBlockMarkdown(input);

			expect(result).toEqual({
				type: "heading",
				level: 1,
				content: longContent,
			});
		});

		it("should handle input with many repeated characters", () => {
			const input = "########################################";
			const result = parseBlockMarkdown(input);

			expect(result).toEqual({
				type: "p",
				content: "########################################",
			});
		});
	});

	describe("includeZWS option", () => {
		describe("with includeZWS: true", () => {
			it.each([
				{
					input: "# ",
					expected: { type: "heading", level: 1, content: ZWS },
				},
				{
					input: "## ",
					expected: { type: "heading", level: 2, content: ZWS },
				},
				{
					input: "- ",
					expected: { type: "ul", content: ZWS },
				},
				{
					input: "* ",
					expected: { type: "ul", content: ZWS },
				},
				{
					input: "+ ",
					expected: { type: "ul", content: ZWS },
				},
				{
					input: "1. ",
					expected: { type: "ol", content: ZWS, start: 1 },
				},
				{
					input: "1) ",
					expected: { type: "ol", content: ZWS, start: 1 },
				},
			])("should use ZWS for empty content: $input", ({ input, expected }) => {
				const result = parseBlockMarkdown(input, {
					includeZWS: true,
					preserveStructure: true,
				});
				expect(result).toEqual(expected);
			});

			it("should not affect blocks with actual content", () => {
				expect(parseBlockMarkdown("# Title", { includeZWS: true })).toEqual({
					type: "heading",
					level: 1,
					content: "Title",
				});
				expect(parseBlockMarkdown("- Item", { includeZWS: true })).toEqual({
					type: "ul",
					content: "Item",
				});
				expect(parseBlockMarkdown("1. Item", { includeZWS: true })).toEqual({
					type: "ol",
					content: "Item",
					start: 1,
				});
			});
		});

		describe("with includeZWS: false (default)", () => {
			it.each([
				{
					input: "# ",
					expected: { type: "heading", level: 1, content: "" },
				},
				{
					input: "## ",
					expected: { type: "heading", level: 2, content: "" },
				},
				{
					input: "- ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "* ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "+ ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "1. ",
					expected: { type: "ol", content: "", start: 1 },
				},
				{
					input: "1) ",
					expected: { type: "ol", content: "", start: 1 },
				},
			])(
				"should use empty string for empty content: $input",
				({ input, expected }) => {
					const result = parseBlockMarkdown(input, {
						includeZWS: false,
						preserveStructure: true,
					});
					expect(result).toEqual(expected);
				},
			);

			it("should use empty string when called without options (default)", () => {
				const result = parseBlockMarkdown("# ", { preserveStructure: true });
				expect(result).toEqual({ type: "heading", level: 1, content: "" });
			});
		});
	});

	describe("combined options: includeZWS and preserveStructure", () => {
		it("should handle both options together correctly", () => {
			// preserveStructure: true, includeZWS: true
			expect(
				parseBlockMarkdown("# ", { includeZWS: true, preserveStructure: true }),
			).toEqual({ type: "heading", level: 1, content: ZWS });

			// preserveStructure: true, includeZWS: false
			expect(
				parseBlockMarkdown("# ", {
					includeZWS: false,
					preserveStructure: true,
				}),
			).toEqual({ type: "heading", level: 1, content: "" });

			// preserveStructure: false, includeZWS: true (should still return null for empty)
			expect(
				parseBlockMarkdown("# ", {
					includeZWS: true,
					preserveStructure: false,
				}),
			).toEqual({ type: "heading", level: 1, content: ZWS });

			// preserveStructure: false, includeZWS: false (default - should return null)
			expect(
				parseBlockMarkdown("# ", {
					includeZWS: false,
					preserveStructure: false,
				}),
			).toEqual({ type: "p", content: "#" });
		});

		it("should handle list items with both options", () => {
			// preserveStructure: true, includeZWS: true
			expect(
				parseBlockMarkdown("- ", { includeZWS: true, preserveStructure: true }),
			).toEqual({ type: "ul", content: ZWS });

			// preserveStructure: true, includeZWS: false
			expect(
				parseBlockMarkdown("1. ", {
					includeZWS: false,
					preserveStructure: true,
				}),
			).toEqual({ type: "ol", content: "", start: 1 });

			// preserveStructure: false (should return null regardless of includeZWS)
			expect(
				parseBlockMarkdown("- ", {
					includeZWS: true,
					preserveStructure: false,
				}),
			).toEqual({ type: "ul", content: ZWS });
			expect(
				parseBlockMarkdown("1. ", {
					includeZWS: false,
					preserveStructure: false,
				}),
			).toEqual({ type: "p", content: "1." });
		});

		it("should not affect blocks with content", () => {
			const content = "# Title with content";

			// All combinations should produce the same result for non-empty content
			expect(
				parseBlockMarkdown(content, {
					includeZWS: true,
					preserveStructure: true,
				}),
			).toEqual({ type: "heading", level: 1, content: "Title with content" });
			expect(
				parseBlockMarkdown(content, {
					includeZWS: false,
					preserveStructure: true,
				}),
			).toEqual({ type: "heading", level: 1, content: "Title with content" });
			expect(
				parseBlockMarkdown(content, {
					includeZWS: true,
					preserveStructure: false,
				}),
			).toEqual({ type: "heading", level: 1, content: "Title with content" });
			expect(
				parseBlockMarkdown(content, {
					includeZWS: false,
					preserveStructure: false,
				}),
			).toEqual({ type: "heading", level: 1, content: "Title with content" });
		});
	});

	describe("preserveStructure option", () => {
		describe("with preserveStructure: true", () => {
			it.each([
				{
					input: "# ",
					expected: { type: "heading", level: 1, content: "" },
				},
				{
					input: "## ",
					expected: { type: "heading", level: 2, content: "" },
				},
				{
					input: "- ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "* ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "+ ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "1. ",
					expected: { type: "ol", content: "", start: 1 },
				},
				{
					input: "1) ",
					expected: { type: "ol", content: "", start: 1 },
				},
				{
					input: "3. ",
					expected: { type: "ol", content: "", start: 3 },
				},
				// With only whitespace content
				{
					input: "#     ",
					expected: { type: "heading", level: 1, content: "" },
				},
				{
					input: "-     ",
					expected: { type: "ul", content: "" },
				},
				{
					input: "1.     ",
					expected: { type: "ol", content: "", start: 1 },
				},
			])(
				"should preserve empty structural blocks: $input",
				({ input, expected }) => {
					const result = parseBlockMarkdown(input, { preserveStructure: true });
					expect(result).toEqual(expected);
				},
			);

			it("should still parse blocks with content normally", () => {
				expect(
					parseBlockMarkdown("# Title", { preserveStructure: true }),
				).toEqual({ type: "heading", level: 1, content: "Title" });
				expect(
					parseBlockMarkdown("- Item", { preserveStructure: true }),
				).toEqual({ type: "ul", content: "Item" });
				expect(
					parseBlockMarkdown("1. Item", { preserveStructure: true }),
				).toEqual({ type: "ol", content: "Item", start: 1 });
			});
		});

		describe("with preserveStructure: false (default)", () => {
			it.each([
				{ input: "# ", expected: { type: "p", content: "#" } },
				{ input: "## ", expected: { type: "p", content: "##" } },
				{ input: "- ", expected: { type: "p", content: "-" } },
				{ input: "* ", expected: { type: "p", content: "*" } },
				{ input: "+ ", expected: { type: "p", content: "+" } },
				{ input: "1. ", expected: { type: "p", content: "1." } },
				{ input: "1) ", expected: { type: "p", content: "1)" } },
				{ input: "3. ", expected: { type: "p", content: "3." } },
				{ input: "#     ", expected: { type: "p", content: "#" } },
				{ input: "-     ", expected: { type: "p", content: "-" } },
				{ input: "1.     ", expected: { type: "p", content: "1." } },
			])(
				"should fall through to paragraph for empty structural blocks: $input",
				({ input, expected }) => {
					const result = parseBlockMarkdown(input, {
						preserveStructure: false,
					});
					expect(result).toEqual(expected);
				},
			);

			it.each([
				{
					input: "# Title",
					expected: { type: "heading", level: 1, content: "Title" },
				},
				{
					input: "- Item",
					expected: { type: "ul", content: "Item" },
				},
				{
					input: "1. Item",
					expected: { type: "ol", content: "Item", start: 1 },
				},
			])(
				"should still parse blocks with content normally: $input",
				({ input, expected }) => {
					const result = parseBlockMarkdown(input, {
						preserveStructure: false,
					});
					expect(result).toEqual(expected);
				},
			);
		});

		describe("edge cases with preserveStructure", () => {
			it("should handle horizontal rules regardless of preserveStructure", () => {
				expect(parseBlockMarkdown("***", { preserveStructure: true })).toEqual({
					type: "hr",
				});
				expect(parseBlockMarkdown("***", { preserveStructure: false })).toEqual(
					{ type: "hr" },
				);
			});

			it("should handle empty paragraphs based on preserveStructure", () => {
				// Empty string should always be null
				expect(parseBlockMarkdown("", { preserveStructure: true })).toBeNull();
				expect(parseBlockMarkdown("", { preserveStructure: false })).toBeNull();

				// Whitespace-only should always be null
				expect(
					parseBlockMarkdown("   ", { preserveStructure: true }),
				).toBeNull();
				expect(
					parseBlockMarkdown("   ", { preserveStructure: false }),
				).toBeNull();
			});
		});
	});

	describe("Type assertions", () => {
		it("should return properly typed Block objects", () => {
			const heading = parseBlockMarkdown("# Test");
			const list = parseBlockMarkdown("- Test");
			const ol = parseBlockMarkdown("1. Test");
			const hr = parseBlockMarkdown("***");
			const paragraph = parseBlockMarkdown("Test");

			// TypeScript should infer these correctly
			if (heading?.type === "heading") {
				expect(typeof heading.level).toBe("number");
				expect(typeof heading.content).toBe("string");
			}

			if (list?.type === "ul") {
				expect(typeof list.content).toBe("string");
				expect(list).not.toHaveProperty("level");
				expect(list).not.toHaveProperty("start");
			}

			if (ol?.type === "ol") {
				expect(typeof ol.content).toBe("string");
				expect(typeof ol.start).toBe("number");
				expect(ol).not.toHaveProperty("level");
			}

			if (hr?.type === "hr") {
				expect(hr).not.toHaveProperty("content");
				expect(hr).not.toHaveProperty("level");
				expect(hr).not.toHaveProperty("start");
			}

			if (paragraph?.type === "p") {
				expect(typeof paragraph.content).toBe("string");
				expect(paragraph).not.toHaveProperty("level");
				expect(paragraph).not.toHaveProperty("start");
			}
		});
	});
});
