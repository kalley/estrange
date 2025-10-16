import { getSelectionRange } from "../dom/cursor-utils";
import type { ActionContext, EditorKey, Handler } from "./types";

const normalizeKey = (event: KeyboardEvent): string => {
	const parts: string[] = [];
	if (event.ctrlKey || event.metaKey) parts.push("mod");
	if (event.shiftKey) parts.push("shift");
	if (event.altKey) parts.push("alt");
	parts.push(event.key.toLowerCase());
	return parts.join("+");
};

export const createActionRegistry = () => {
	const actions = new Map<EditorKey, Handler>();

	return {
		register: (key: EditorKey | EditorKey[], handler: Handler) => {
			if (Array.isArray(key)) {
				key.forEach((k) => {
					actions.set(k, handler);
				});
			} else {
				actions.set(key, handler);
			}
		},
		canHandle: (event: KeyboardEvent) => {
			// Check 1: Do we have a handler for this key?
			const key = normalizeKey(event);
			if (!actions.has(key)) return false;

			if (key === "mod+u" || key.includes("shift")) return true;

			// Check 2: Is selection collapsed?
			const range = getSelectionRange();
			if (!range?.collapsed) return false;

			return true;
		},
		handle: (event: KeyboardEvent, context: ActionContext) => {
			const key = normalizeKey(event);
			const handler = actions.get(key);

			return handler?.(event, context) ?? null;
		},
		entries: () => actions.entries(),
	};
};
