export const DRAFT_KEY = "estrange-draft";

export interface DraftData {
	prompt: string;
	response: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDraftData(data: unknown): data is DraftData {
	return (
		isRecord(data) &&
		typeof data.prompt === "string" &&
		typeof data.response === "string"
	);
}

export function clearDraft() {
	localStorage.removeItem(DRAFT_KEY);
}
