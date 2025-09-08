import type { DailyPrompt } from "../model/daily-prompt.schema";

export async function fetchDailyPrompt() {
	try {
		const response = await fetch("/estrange/data/daily-prompt.json");
		return response.json() as unknown as DailyPrompt;
	} catch (error) {
		console.error("Error fetching prompt:", error);
		return null;
	}
}
