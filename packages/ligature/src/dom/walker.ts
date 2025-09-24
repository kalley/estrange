interface TextWalker extends TreeWalker {
	currentNode: Text;
	nextNode(): Text | null;
	previousNode(): Text | null;
}

export const createTextWalker = (
	root: Node,
	filter?: (node: Text) => boolean,
): TextWalker => {
	const wrappedFilter = filter
		? (node: Node) =>
				node.nodeType === Node.TEXT_NODE && filter(node as Text)
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
