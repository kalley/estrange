import { restoreCursor } from "../dom/cursor-utils";

export const withPreservedCursor = (
	selection: Selection,
	fallback: HTMLElement,
	fn: () => void,
): void => {
	if (selection.rangeCount === 0) {
		fn();
		return;
	}

	const range = selection.getRangeAt(0);
	const container = range.startContainer;
	const offset = range.startOffset;

	fn();
	restoreCursor(selection, container, offset, fallback);
};
