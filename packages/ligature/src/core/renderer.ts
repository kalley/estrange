import { createTextWalker } from "../dom/walker";
import { stripZWS, ZWS } from "../dom/zw-utils";
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

export interface FormattingResult {
	transformed: boolean;
	newCursorPosition?: {
		node: Text;
		offset: number;
	};
}

export const applyInlineFormatting = (block: HTMLElement): FormattingResult => {
	const textNodes = createTextWalker(block);

	let transformed = false;

	// Transform each text node that has complete patterns
	while (textNodes.nextNode()) {
		const textNode = textNodes.currentNode;
		const text = textNode.textContent || "";
		if (!text) continue;

		const ast = parseInlinePatterns(text);
		const needsFormatting =
			ast.length > 1 || ast.some((node) => node.type !== "text");

		if (!needsFormatting) continue;

		transformed = true;
		const fragment = astToDOM(ast);

		textNode.parentNode?.replaceChild(fragment, textNode);
	}

	if (!transformed) {
		return { transformed: false };
	}

	block.normalize();

	// Get all text nodes after transformation
	const newWalker = createTextWalker(block);
	let targetNode: Text | null = null;

	while (newWalker.nextNode()) {
		targetNode = newWalker.currentNode;

		if (targetNode.parentNode !== block) {
			targetNode = newWalker.nextNode();

			if (!targetNode) {
				targetNode = document.createTextNode(ZWS);
				block.appendChild(targetNode);
			}

			if (targetNode?.parentNode === block) continue;
		}
	}

	if (targetNode) {
		return {
			transformed: true,
			newCursorPosition: {
				node: targetNode,
				offset: 1,
			},
		};
	}

	return { transformed: true };
};

const setContent = (element: HTMLElement, content: string) => {
	const text = stripZWS(content).trim();

	if (!text) {
		element.textContent = "";
		return;
	}

	element.textContent = text;
	applyInlineFormatting(element);
};

interface RenderOptions {
	currentList: HTMLUListElement | HTMLOListElement | null;
}

const createHeading = (block: HeadingBlock, options: RenderOptions) => {
	options.currentList = null;

	const heading = document.createElement(`h${block.level}`);
	setContent(heading, block.content);
	return heading;
};

const createParagraph = (block: ParagraphBlock, options: RenderOptions) => {
	options.currentList = null;
	const paragraph = document.createElement("p");
	setContent(paragraph, block.content);
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

	setContent(listItem, block.content);
	list.appendChild(listItem);
	options.currentList = list;
	return list;
};

const appendListItem = (
	list: HTMLUListElement | HTMLOListElement,
	content: string,
) => {
	const listItem = document.createElement("li");
	setContent(listItem, content);
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
		return appendListItem(options.currentList, block.content);
	}
};

type BlockRenderers = {
	[K in Block["type"]]: (block: Block, options: RenderOptions) => HTMLElement;
};

export const blockRenderers: BlockRenderers = {
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

export const renderMarkdown = (markdown: string): DocumentFragment => {
	const fragment = document.createDocumentFragment();
	if (!markdown.trim()) return fragment;

	const lines = markdown.split("\n");
	const renderOptions = {
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
