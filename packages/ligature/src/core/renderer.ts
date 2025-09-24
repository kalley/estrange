import { createTextWalker } from "../dom/walker";
import { ZWS } from "../dom/zw-manager";
import {
	type Block,
	type HeadingBlock,
	type HorizontalRuleBlock,
	type OrderListBlock,
	type ParagraphBlock,
	parseBlockMarkdown,
	type UnorderedListBlock,
} from "../parsers/block-parser";
import { astToDOM, parseInlinePatterns } from "../parsers/inline-parser";

const applyInlineFormatting = (block: HTMLElement, includeZWS: boolean) => {
	const walker = createTextWalker(block);
	const textNodes: Text[] = [];

	while (walker.nextNode()) {
		if (
			walker.currentNode.textContent !== ZWS &&
			walker.currentNode.textContent !== ""
		) {
			textNodes.push(walker.currentNode);
		}
	}

	for (const textNode of textNodes) {
		const text = textNode.textContent || "";
		if (!text) continue;

		const ast = parseInlinePatterns(text);
		const needsFormatting =
			ast.length > 1 || ast.some((node) => node.type !== "text");

		if (!needsFormatting) continue;

		const fragment = astToDOM(ast, includeZWS);
		textNode.parentNode?.replaceChild(fragment, textNode);
	}

	block.normalize();
};

const setContent = (
	element: HTMLElement,
	content: string,
	options: { includeZWS: boolean } = { includeZWS: false },
) => {
	const text = content.trim();

	if (!text) {
		element.textContent = options.includeZWS ? ZWS : "";
		return;
	}

	element.textContent = options.includeZWS ? `${ZWS}${text}` : text;
	applyInlineFormatting(element, options.includeZWS);
};

interface RenderOptions {
	includeZWS: boolean;
	currentList: HTMLUListElement | HTMLOListElement | null;
}

const createHeading = (block: HeadingBlock, options: RenderOptions) => {
	options.currentList = null;

	const heading = document.createElement(`h${block.level}`);
	setContent(heading, block.content, options);
	return heading;
};

const createParagraph = (block: ParagraphBlock, options: RenderOptions) => {
	options.currentList = null;
	const paragraph = document.createElement("p");
	setContent(paragraph, block.content, options);
	return paragraph;
};

const createHorizontalRule = (
	_block: HorizontalRuleBlock,
	options: RenderOptions,
) => {
	options.currentList = null;
	return document.createElement("hr");
};

const createList = (
	block: OrderListBlock | UnorderedListBlock,
	options: RenderOptions,
) => {
	const list = document.createElement(block.type);
	if (block.type === "ol" && block.start !== 1) {
		list.setAttribute("start", `${block.start}`);
	}
	const listItem = document.createElement("li");

	setContent(listItem, block.content, options);
	list.appendChild(listItem);
	options.currentList = list;
	return list;
};

const appendListItem = (
	list: HTMLUListElement | HTMLOListElement,
	content: string,
	options: RenderOptions,
) => {
	const listItem = document.createElement("li");
	setContent(listItem, content, options);
	list.appendChild(listItem);
	return list;
};

const createListItem = <T extends UnorderedListBlock | OrderListBlock>(
	block: T,
	options: RenderOptions,
) => {
	if (
		!options.currentList ||
		options.currentList.nodeName.toLowerCase() !== block.type
	) {
		return createList(block, options);
	} else {
		return appendListItem(options.currentList, block.content, options);
	}
};

type BlockRenderers = {
	[K in Block["type"]]: (block: Block, options: RenderOptions) => HTMLElement;
};

const blockRenderers: BlockRenderers = {
	heading: (block, renderOptions) =>
		createHeading(block as HeadingBlock, renderOptions),
	hr: (block: Block, options: RenderOptions) =>
		createHorizontalRule(block as HorizontalRuleBlock, options),
	ol: (block, renderOptions) =>
		createListItem(block as OrderListBlock, renderOptions),
	ul: (block, renderOptions) =>
		createListItem(block as UnorderedListBlock, renderOptions),
	p: (block, renderOptions) =>
		createParagraph(block as ParagraphBlock, renderOptions),
};

export const renderMarkdown = (
	markdown: string,
	{ includeZWS = false }: { includeZWS?: boolean } = {},
): DocumentFragment => {
	const fragment = document.createDocumentFragment();
	if (!markdown.trim()) return fragment;

	const lines = markdown.split("\n");
	const renderOptions = {
		includeZWS,
		currentList: null,
	};

	for (const line of lines) {
		const block = parseBlockMarkdown(line);

		if (block) {
			fragment.appendChild(blockRenderers[block.type](block, renderOptions));
		} else {
			renderOptions.currentList = null;
		}
	}

	return fragment;
};
