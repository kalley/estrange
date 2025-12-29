import { createAsync } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import {
	type CreativePrompt,
	getAllPrompts,
} from "@/entities/creative-prompts";
import { ModalProvider } from "@/shared/contexts/modal-context";
import { Artifact } from "@/shared/ui/artifact";
import { list } from "./history-page.css";
import { Entry } from "./ui/entry";

export function HistoryPage() {
	const allPrompts = createAsync(() => getAllPrompts());
	const [selectedEntry, setSelectedEntry] = createSignal<CreativePrompt | null>(
		null,
	);

	return (
		<ModalProvider>
			<ul class={list}>
				<For each={allPrompts()}>
					{(prompt) => (
						<Entry prompt={prompt} setSelectedEntry={setSelectedEntry} />
					)}
				</For>
			</ul>
			<Artifact
				entry={selectedEntry()}
				onClose={() => setSelectedEntry(null)}
			/>
		</ModalProvider>
	);
}
