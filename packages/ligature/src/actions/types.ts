import type { CursorManager } from "../dom/cursor";
import type { History } from "../history/state-manager";

export interface ActionContext {
	cursorManager: CursorManager;
	editor: HTMLElement;
	getHistory: () => History;
	setHistory: (history: History) => void;
}

export type EditorKey =
	| "backspace"
	| "delete"
	| "enter"
	| "tab"
	| "escape"
	| "arrowleft"
	| "arrowright"
	| "arrowup"
	| "arrowdown"
	| (string & {});

export type Handler = (
	event: KeyboardEvent,
	context: ActionContext,
) => HTMLElement | null;
