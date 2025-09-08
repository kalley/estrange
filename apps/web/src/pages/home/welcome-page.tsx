import { createAsync } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import { getLatestPrompt } from "@/entities/creative-prompts";
import { FirstTime } from "./ui/first-time";

export function WelcomePage() {
	const latest = createAsync(() => getLatestPrompt());

	return (
		<Suspense fallback="Loading...">
			<Show fallback={<FirstTime />} when={latest()}>
				<div>Welcome!</div>
			</Show>
		</Suspense>
	);
}
