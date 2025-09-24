export const ZWS = "\u200B";

export const createZWSManager = () => {
	const insertCursorEscapes = (element: HTMLElement) => {
		const formattedElements = element.querySelectorAll("strong, em, s");
		formattedElements.forEach((el) => {
			const nextSibling = el.nextSibling;
			const needsEscape =
				!nextSibling ||
				(nextSibling.nodeType === Node.TEXT_NODE &&
					!nextSibling.textContent?.startsWith(ZWS));

			if (needsEscape) {
				const zwsNode = document.createTextNode(ZWS);
				el.parentNode?.insertBefore(zwsNode, el.nextSibling);
			}
		});
	};

	const isAtEndOfFormattedElement = () => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return false;

		const range = selection.getRangeAt(0);
		if (!range.collapsed) return false;

		const container = range.startContainer;
		const offset = range.startOffset;

		if (container.nodeType === Node.TEXT_NODE) {
			const parent = container.parentElement;
			const isFormatted =
				parent && ["STRONG", "EM", "S"].includes(parent.tagName);
			const isAtEnd = offset === (container.textContent?.length || 0);
			return isFormatted && isAtEnd;
		}
		return false;
	};

	const escapeCursor = () => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return false;

		const range = selection.getRangeAt(0);
		const container = range.startContainer;

		if (container.nodeType === Node.TEXT_NODE) {
			const parent = container.parentElement;
			if (parent && ["STRONG", "EM", "S"].includes(parent.tagName)) {
				let nextSibling = parent.nextSibling;

				if (!nextSibling || !nextSibling.textContent?.startsWith(ZWS)) {
					nextSibling = document.createTextNode(ZWS);
					parent.parentNode?.insertBefore(nextSibling, parent.nextSibling);
				}

				const newRange = document.createRange();
				newRange.setStart(nextSibling, 1);
				newRange.collapse(true);
				selection.removeAllRanges();
				selection.addRange(newRange);
				return true;
			}
		}
		return false;
	};

	return { insertCursorEscapes, isAtEndOfFormattedElement, escapeCursor };
};

export type ZWSManager = ReturnType<typeof createZWSManager>;
