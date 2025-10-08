import { ZWS } from "../dom/zw-utils";

export interface HeadingBlock {
	type: "heading";
	level: number;
	content: string;
}

export interface OrderListBlock {
	type: "ol";
	content: string;
	start: number;
}

export interface UnorderedListBlock {
	type: "ul";
	content: string;
}

export interface HorizontalRuleBlock {
	type: "hr";
}

export interface ParagraphBlock {
	type: "p";
	content: string;
}

export type Block =
	| HeadingBlock
	| OrderListBlock
	| UnorderedListBlock
	| HorizontalRuleBlock
	| ParagraphBlock;

const PARSERS = [
	{
		name: "heading",
		regex: /^\s*(#{1,6})\s+(.*)?$/,
		handler: (match: RegExpMatchArray, includeZWS: boolean): HeadingBlock => ({
			type: "heading",
			level: match[1].length,
			content: (match[2]?.trim() || (includeZWS ? ZWS : "")).replace(
				/\s+#*$/,
				"",
			),
		}),
	},
	{
		name: "hr",
		regex: /^\s*([*\-_])\s*(\1\s*){2,}$/,
		handler: (): Block => ({ type: "hr" }),
	},
	{
		name: "ul",
		regex: /^\s*([-*+])\s+(.*)$/,
		handler: (
			match: RegExpMatchArray,
			includeZWS: boolean,
		): UnorderedListBlock => ({
			type: "ul",
			content: match[2].trim() || (includeZWS ? ZWS : ""),
		}),
	},
	{
		name: "ol",
		regex: /^\s*(\d+)([.)])\s+(.*)$/,
		handler: (
			match: RegExpMatchArray,
			includeZWS: boolean,
		): OrderListBlock => ({
			type: "ol",
			start: parseInt(match[1], 10),
			content: match[3].trim() || (includeZWS ? ZWS : ""),
		}),
	},
];

export const BLOCK_REGEXES = PARSERS.map((p) => p.regex);

export const parseBlockMarkdown = (
	text: string,
	options: { includeZWS?: boolean; preserveStructure?: boolean } = {},
) => {
	if (!text.trim()) return null;

	const cleanText = text.replaceAll(ZWS, "");

	for (const parser of PARSERS) {
		const match = cleanText.match(parser.regex);
		if (match) {
			const block = parser.handler(match, !!options.includeZWS);

			// Check if block has empty content and we're not preserving structure
			if (!!options.preserveStructure || !isEmptyBlock(block)) {
				return block;
			}
		}
	}

	// Paragraph fallback - trim the content
	const trimmedContent = cleanText.trim();
	return trimmedContent
		? ({ type: "p", content: trimmedContent } as const)
		: null;
};

const isEmptyBlock = (block: Block): boolean => {
	if (block.type === "hr") return false;
	return !block.content.trim();
};
