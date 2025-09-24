import { redoHistory, undoHistory } from "../history/state-manager";
import type { Handler } from "./types";

export const createUndoRedoActions = (
	processBlockFn: (node: ChildNode) => void,
) => {
	return {
		undo: {
			canHandle: (e) =>
				(e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey,
			handle: (e, context) => {
				e.preventDefault();
				const result = undoHistory(
					context.getHistory(),
					context.editor,
					context.cursorManager,
					processBlockFn,
				);
				context.setHistory(result.history);
				return { preventDefault: true, shouldProcess: false };
			},
		},
		redo: {
			canHandle: (e) =>
				(e.ctrlKey || e.metaKey) &&
				((e.key === "z" && e.shiftKey) || e.key === "y"),
			handle: (e, context) => {
				e.preventDefault();
				const result = redoHistory(
					context.getHistory(),
					context.editor,
					context.cursorManager,
					processBlockFn,
				);
				context.setHistory(result.history);
				return { preventDefault: true, shouldProcess: false };
			},
		},
	} satisfies Record<string, Handler>;
};
