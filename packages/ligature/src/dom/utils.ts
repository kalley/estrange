export const isNode = (node: unknown): node is Node => {
	return node instanceof Node;
};

export const isElementNode = (node: unknown): node is Element => {
	return isNode(node) && node.nodeType === Node.ELEMENT_NODE;
};

export const isTextNode = (node: unknown): node is Text => {
	return isNode(node) && node.nodeType === Node.TEXT_NODE;
};

export const isCommentNode = (node: unknown): node is Comment => {
	return isNode(node) && node.nodeType === Node.COMMENT_NODE;
};

export const isDocumentNode = (node: unknown): node is Document => {
	return isNode(node) && node.nodeType === Node.DOCUMENT_NODE;
};

export const isDocumentFragmentNode = (
	node: unknown,
): node is DocumentFragment => {
	return isNode(node) && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
};

export const isDocumentTypeNode = (node: unknown): node is DocumentType => {
	return isNode(node) && node.nodeType === Node.DOCUMENT_TYPE_NODE;
};

export const isChildNode = (node: unknown): node is ChildNode => {
	return isElementNode(node) || isTextNode(node) || isCommentNode(node);
};

export const isHTMLElement = (node: unknown): node is HTMLElement => {
	return isElementNode(node) && node instanceof HTMLElement;
};
