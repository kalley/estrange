import { createAsync } from "@solidjs/router";
import { createMemo } from "solid-js";
import { useHasDraft } from "@/shared/contexts/draft/draft-context";
import { getLatestPrompt } from "../api/creative-prompt-db";
import { useDailyPrompt } from "../api/daily-prompt.api";

type ResponseState =
	| "first-time"
	| "prompt-ready"
	| "response-in-progress"
	| "completed-today";

export const useResponseState = () => {
	const latestPrompt = createAsync(() => getLatestPrompt());
	const todaysPrompt = useDailyPrompt();
	const hasDraft = useHasDraft();
	const hasCompletedToday = createMemo(
		() => latestPrompt()?.prompt === todaysPrompt()?.prompt,
	);

	return createMemo<ResponseState | undefined>(() => {
		const latest = latestPrompt();

		// Wait for async data to load
		if (latest === undefined) return undefined;

		if (latest === null) return "first-time";
		if (hasCompletedToday()) return "completed-today";
		if (hasDraft()) return "response-in-progress";
		return "prompt-ready";
	});
};
