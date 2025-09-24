import { saveHistoryState } from "../history/state-manager";
import type { Handler } from "./types";

export const createDefaultDeleteAction = () => {
	return {
		canHandle: (e) => e.key === "Backspace" || e.key === "Delete",
		handle: (e, context) => {
			context.setHistory(
				saveHistoryState(
					context.getHistory(),
					context.editor,
					context.cursorManager,
					e.key.toLowerCase(),
				),
			);
			return { preventDefault: false, shouldProcess: true };
		},
	} satisfies Handler;
};
