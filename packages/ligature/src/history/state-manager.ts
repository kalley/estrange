import type { CursorManager, SelectionState } from "../dom/cursor";

interface HistoryState {
	html: string;
	selection: SelectionState | null;
	timestamp: number;
	operation: string;
}

export interface History {
	states: HistoryState[];
	currentIndex: number;
	maxSize: number;
	isUndoRedo: boolean;
}

export const createHistory = (maxSize = 100): History => {
	return {
		states: [],
		currentIndex: -1,
		maxSize,
		isUndoRedo: false,
	};
};

export const saveHistoryState = (
	history: History,
	editor: HTMLElement,
	cursorManager: CursorManager,
	operation = "edit",
): History => {
	if (history.isUndoRedo) return history;

	const state = {
		html: editor.innerHTML,
		selection: cursorManager.captureSelectionState(editor),
		timestamp: Date.now(),
		operation,
	};

	const states = [...history.states.slice(0, history.currentIndex + 1), state];
	const trimmedStates =
		states.length > history.maxSize ? states.slice(-history.maxSize) : states;

	return {
		...history,
		states: trimmedStates,
		currentIndex: trimmedStates.length - 1,
	};
};

// Enhanced undo/redo with better cursor restoration
export const undoHistory = (
	history: History,
	editor: HTMLElement,
	cursorManager: CursorManager,
	processBlockFn: (block: ChildNode) => void,
) => {
	if (history.currentIndex <= 0) return { history, success: false };

	const newHistory = {
		...history,
		isUndoRedo: true,
		currentIndex: history.currentIndex - 1,
	};

	const state = history.states[newHistory.currentIndex];
	editor.innerHTML = state.html;

	if (state.selection) {
		// Use better restoration
		setTimeout(() => {
			cursorManager.restoreSelectionState(editor, state.selection);
		}, 0);
	}

	Array.from(editor.childNodes).forEach(processBlockFn);

	return {
		history: { ...newHistory, isUndoRedo: false },
		success: true,
	};
};

export const redoHistory = (
	history: History,
	editor: HTMLElement,
	cursorManager: CursorManager,
	processBlockFn: (node: ChildNode) => void,
) => {
	if (history.currentIndex >= history.states.length - 1)
		return { history, success: false };

	const newHistory = {
		...history,
		isUndoRedo: true,
		currentIndex: history.currentIndex + 1,
	};

	const state = history.states[newHistory.currentIndex];
	editor.innerHTML = state.html;

	if (state.selection) {
		setTimeout(() => {
			cursorManager.restoreSelectionState(editor, state.selection);
		}, 0);
	}

	Array.from(editor.childNodes).forEach(processBlockFn);

	return {
		history: { ...newHistory, isUndoRedo: false },
		success: true,
	};
};
