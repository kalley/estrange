import type { CursorManager } from "../dom/cursor";
import type { History } from "../history/state-manager";

export interface HandlerContext {
	cursorManager: CursorManager;
	editor: HTMLElement;
	getHistory: () => History;
	setHistory: (history: History) => void;
}

export interface Handler {
	canHandle: (e: KeyboardEvent, context: HandlerContext) => boolean;
	handle: (e: KeyboardEvent, context: HandlerContext) => void;
}
