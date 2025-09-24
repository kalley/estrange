import { isChildNode, isHTMLElement } from "../dom/utils";

export const safeGetSelection = () => {
	try {
		const sel = window.getSelection();
		return sel?.rangeCount ? sel.getRangeAt(0) : null;
	} catch (e) {
		console.warn("Selection access failed:", e);
		return null;
	}
};

export const setCaretAfter = (node: Node) => {
	const range = document.createRange();
	const sel = window.getSelection();
	range.setStartAfter(node);
	range.collapse(true);
	sel?.removeAllRanges();
	sel?.addRange(range);
	node.parentNode?.normalize();
};

export const setCaretBefore = (node: Node) => {
	const range = document.createRange();
	const sel = window.getSelection();
	range.setStartBefore(node);
	range.collapse(true);
	sel?.removeAllRanges();
	sel?.addRange(range);
	node.parentNode?.normalize();
};

export const getClosestBlock = (node: HTMLElement, root: HTMLElement) => {
	let current: Node | null = node;
	while (current && current !== root) {
		if (
			isHTMLElement(current) &&
			(current.tagName.match(/^H[1-6]$/) ||
				current.tagName === "DIV" ||
				current.tagName === "LI")
		) {
			return current;
		}
		current = current.parentNode;
	}
	// If we reached the root without finding a block, the root IS the block
	return current === root ? root : null;
};

export const getNodePath = (node: Node, root: Node) => {
	const path = [];
	while (node && node !== root) {
		if (!isChildNode(node)) break;
		const parent = node.parentNode;
		if (parent) {
			path.unshift(Array.from(parent.childNodes).indexOf(node));
			node = parent;
		}
	}
	return path;
};

export const getNodeFromPath = (path: number[], root: Node) => {
	let node = root;
	for (const index of path) {
		if (node.childNodes[index]) {
			node = node.childNodes[index];
		} else {
			return null;
		}
	}
	return node;
};
