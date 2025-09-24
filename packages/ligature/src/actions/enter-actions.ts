import { ZWS } from "../dom/zw-manager";
import { saveHistoryState } from "../history/state-manager";
import type { HandlerContext } from "./types";

export const createHeadingEnterAction = () => {
	return {
		canHandle: (e: KeyboardEvent, context: HandlerContext) => {
			if (e.key !== "Enter") return false;

			const selection = window.getSelection();
			if (!selection?.rangeCount) return false;

			const range = selection.getRangeAt(0);
			const container = range.startContainer;

			// Check if we're in a heading
			let element =
				container.nodeType === Node.TEXT_NODE
					? container.parentElement
					: (container as Element);

			while (element && element !== context.editor) {
				if (element.tagName?.match(/^H[1-6]$/)) {
					return true;
				}
				element = element.parentElement;
			}

			return false;
		},

		handle: (e: KeyboardEvent, context: HandlerContext) => {
			e.preventDefault();

			const selection = window.getSelection();
			if (!selection?.rangeCount) {
				return { preventDefault: true, shouldProcess: false };
			}

			const range = selection.getRangeAt(0);
			const container = range.startContainer;

			// Find the heading element
			let headingElement =
				container.nodeType === Node.TEXT_NODE
					? container.parentElement
					: (container as HTMLElement);

			while (headingElement && !headingElement.tagName?.match(/^H[1-6]$/)) {
				headingElement = headingElement.parentElement;
			}

			if (!headingElement) {
				return { preventDefault: true, shouldProcess: false };
			}

			// Save to history before making changes
			context.setHistory(
				saveHistoryState(
					context.getHistory(),
					context.editor,
					context.cursorManager,
					"heading-enter",
				),
			);

			// Create new div for paragraph
			const newParagraph = document.createElement("div");

			// If cursor is at end of heading, just create empty paragraph
			const isAtEnd =
				range.startOffset === (headingElement.textContent?.length || 0);

			if (isAtEnd) {
				newParagraph.textContent = ZWS;
			} else {
				// Split the heading - move text after cursor to new paragraph
				const headingText = `${ZWS}${headingElement.textContent}`;
				const beforeCursor = headingText.slice(0, range.startOffset);
				const afterCursor = headingText.slice(range.startOffset);

				headingElement.textContent = beforeCursor;
				newParagraph.textContent = afterCursor;
			}

			// Insert new paragraph after heading
			headingElement.parentNode?.insertBefore(
				newParagraph,
				headingElement.nextSibling,
			);

			// Move cursor to start of new paragraph
			const newRange = document.createRange();
			if (newParagraph.firstChild) {
				newRange.setStart(newParagraph.firstChild, 1);
			} else {
				newRange.setStart(newParagraph, 0);
			}
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);

			return { preventDefault: true, shouldProcess: true };
		},
	};
};
