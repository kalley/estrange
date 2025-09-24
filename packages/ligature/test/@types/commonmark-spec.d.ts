declare module "commonmark-spec" {
  export const SECTIONS = [
  	"Tabs",
  	"Backslash escapes",
  	"Entity and numeric character references",
  	"Precedence",
  	"Thematic breaks",
  	"ATX headings",
  	"Setext headings",
  	"Indented code blocks",
  	"Fenced code blocks",
  	"HTML blocks",
  	"Link reference definitions",
  	"Paragraphs",
  	"Blank lines",
  	"Block quotes",
  	"List items",
  	"Lists",
  	"Inlines",
  	"Code spans",
  	"Emphasis and strong emphasis",
  	"Links",
  	"Images",
  	"Autolinks",
  	"Raw HTML",
  	"Hard line breaks",
  	"Soft line breaks",
  	"Textual content",
  ] as const;

	interface Test {
		section: (typeof SECTIONS)[number];
		markdown: string;
		html: string;
		number: number;
	}

	export const tests: Test[];
}
