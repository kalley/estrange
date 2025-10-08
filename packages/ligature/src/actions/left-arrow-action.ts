import { getSelectionRange } from "../dom/cursor";
import type { Handler } from "./types";

export const createLeftArrowAction = (): Handler => (event, context) => {
	const selection = window.getSelection();
	const range = getSelectionRange();

	if (!selection || !range || !range.collapsed) return null;
};
