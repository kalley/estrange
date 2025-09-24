import { ZWS } from "../dom/zw-manager";

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
		regex: /^\s*(#{1,6})\s+(.*)$/,
		handler: (match: RegExpMatchArray): HeadingBlock => ({
			type: "heading",
			level: match[1].length,
			content: (match[2].trim() || ZWS).replace(/\s+#*$/, ""),
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
		handler: (match: RegExpMatchArray): UnorderedListBlock => ({
			type: "ul",
			content: match[2] || ZWS,
		}),
	},
	{
		name: "ol",
		regex: /^\s*(\d+)([.)])\s+(.*)$/,
		handler: (match: RegExpMatchArray): OrderListBlock => ({
			type: "ol",
			start: parseInt(match[1], 10),
			content: match[3] || ZWS,
		}),
	},
];

export const parseBlockMarkdown = (text: string) => {
	if (!text.trim()) return null;
	for (const parser of PARSERS) {
		const match = text.match(parser.regex);
		if (match) return parser.handler(match);
	}
	return { type: "p", content: text } as const;
};
