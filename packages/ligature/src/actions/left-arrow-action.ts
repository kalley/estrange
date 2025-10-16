import { getSelectionRange } from "../dom/cursor-utils";
import type { Handler } from "./types";

export const createLeftArrowAction = (): Handler => (_event, _context) => {
	const selection = window.getSelection();
	const range = getSelectionRange();

	if (!selection || !range || !range.collapsed) return null;

	return null;
};
