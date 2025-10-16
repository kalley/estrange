export interface ActionContext {
	editor: HTMLElement;
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
