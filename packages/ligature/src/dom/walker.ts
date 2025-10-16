import { isElementNode, isTextNode } from "./utils";
import { ZWS } from "./zw-utils";

interface TypedWalker<T extends Node> extends TreeWalker {
	currentNode: T;
	nextNode(): T | null;
	previousNode(): T | null;
	lastChild(): T | null;
}

type TextWalker = TypedWalker<Text>;
type ElementWalker = TypedWalker<Element>;

export const createTextWalker = (
	root: Node,
	filter?: (node: Text) => boolean,
): TextWalker => {
	const wrappedFilter = filter
		? (node: Node) =>
				isTextNode(node) && filter(node)
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_SKIP
		: null;

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT,
		wrappedFilter,
	);
	return walker as TextWalker;
};

export const createElementWalker = (
	root: Node,
	filter?: (node: Element) => boolean,
): ElementWalker => {
	const wrappedFilter = filter
		? (node: Node) =>
				isElementNode(node) && filter(node)
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_SKIP
		: null;

	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_ELEMENT,
		wrappedFilter,
	);
	return walker as ElementWalker;
};

export const ensureConnected = (node: Node | null): node is Node => {
	return !!node && node.isConnected;
};

/**
 * Find the last text node within a node that has content (not just ZWS)
 */
export const findLastTextNode = (node: Node): Text | null => {
	const walker = createTextWalker(node, (n) => n.textContent !== ZWS);
	return walker.lastChild();
};

/**
 * Gets the last text node under a given node, or null if none found.
 */
export const getDeepLastTextNode = (node: Node): Node | null => {
	if (!ensureConnected(node)) return null;
	if (isTextNode(node)) return node;
	return findLastTextNode(node) ?? null;
};

export function findPreviousTextNode(
	node: Node,
	editor: HTMLElement,
): Text | null {
	let current: Node | null = node;

	while (current && current !== editor) {
		// Try previous sibling first
		if (current.previousSibling) {
			// Use your helper that skips ZWS-only nodes
			const lastText = getDeepLastTextNode(current.previousSibling);
			return isTextNode(lastText) ? lastText : null;
		}

		// No previous sibling, go up to parent and try again
		current = current.parentNode;
	}

	return null;
}
