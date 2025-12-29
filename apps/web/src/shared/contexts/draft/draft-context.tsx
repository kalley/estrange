import { createAsync } from "@solidjs/router";
import {
	type Accessor,
	createContext,
	createMemo,
	type ParentProps,
	useContext,
} from "solid-js";
import {
	DRAFT_KEY,
	type DraftData,
	isDraftData,
	useDailyPrompt,
} from "@/entities/creative-prompts";
import { createStorageSignal } from "@/shared/browser/create-storage-signal";

// DraftContext.tsx
type DraftContextValue = {
	draft: Accessor<string>;
	hasDraft: Accessor<boolean>;
	updateDraft: (response: string) => void;
	clearDraft: () => void;
};

const DraftContext = createContext<DraftContextValue>();

export function DraftProvider(props: ParentProps) {
	const todaysPrompt = useDailyPrompt();
	const [draftData, setDraftData] = createStorageSignal<DraftData | null>(
		DRAFT_KEY,
		null,
	);

	const draft = createMemo(() => {
		const prompt = todaysPrompt()?.prompt;
		const data = draftData();

		if (!prompt || !data || !isDraftData(data) || data.prompt !== prompt) {
			return "";
		}

		return data.response;
	});

	const hasDraft = createMemo(() => draft().length > 0);

	const updateDraft = (response: string) => {
		const prompt = todaysPrompt()?.prompt;
		if (!prompt) return;

		setDraftData({
			prompt,
			response,
		});
	};

	const clearDraft = () => {
		setDraftData(null);
	};

	return (
		<DraftContext.Provider value={{ draft, hasDraft, updateDraft, clearDraft }}>
			{props.children}
		</DraftContext.Provider>
	);
}

export function useDraftWriter() {
	const context = useContext(DraftContext);
	if (!context)
		throw new Error("useDraftWriter must be used within DraftProvider");
	return { draft: context.draft, updateDraft: context.updateDraft };
}

export function useHasDraft() {
	const context = useContext(DraftContext);
	if (!context)
		throw new Error("useHasDraft must be used within DraftProvider");
	return context.hasDraft;
}
