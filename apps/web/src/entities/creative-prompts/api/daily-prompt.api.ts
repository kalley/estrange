import { createResource } from "solid-js";
import type { DailyPrompt } from "../model/daily-prompt.schema";

const CACHE_KEY = "daily-prompt-cache";

function getDayKey() {
	const now = new Date();
	const central = new Date(
		now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
	);

	// Before 6:15 AM Central, use yesterday's date to avoid race conditions
	if (central.getHours() === 6 && central.getMinutes() < 15) {
		central.setDate(central.getDate() - 1);
	}

	return central.toDateString(); // "Sat Sep 14 2025"
}

function getCachedPrompt(): DailyPrompt | null {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) return null;

		const { data, dayKey } = JSON.parse(cached);

		if (dayKey !== getDayKey()) {
			localStorage.removeItem(CACHE_KEY);
			return null;
		}

		return data;
	} catch {
		return null;
	}
}

async function fetchDailyPrompt(): Promise<DailyPrompt | null> {
	const cached = getCachedPrompt();
	if (cached) return cached;

	try {
		const response = await fetch(import.meta.env.VITE_PROMPT_URL);
		const data = (await response.json()) as DailyPrompt;

		localStorage.setItem(
			CACHE_KEY,
			JSON.stringify({
				data,
				dayKey: getDayKey(),
			}),
		);

		return data;
	} catch (error) {
		console.error("Error fetching prompt:", error);
		return null;
	}
}

const [prompt] = createResource(fetchDailyPrompt);

export function useDailyPrompt() {
	return prompt;
}
