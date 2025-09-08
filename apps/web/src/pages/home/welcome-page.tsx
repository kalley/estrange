import { createAsync } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import { getLatestPrompt } from "@/entities/creative-prompts";
import { FirstTime } from "./ui/first-time";
import { ReturnVisit } from "./ui/return-visit";

export function WelcomePage() {
	const latest = createAsync(() => getLatestPrompt());

	return (
		<Suspense fallback="Loading...">
			<Show fallback={<FirstTime />} when={latest()}>
				<ReturnVisit />
			</Show>
		</Suspense>
	);
}
