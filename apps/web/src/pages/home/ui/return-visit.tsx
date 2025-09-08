import { A, createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { fetchDailyPrompt, getLatestPrompt } from "@/entities/creative-prompts";
import { Card } from "@/shared/ui/card";
import * as styles from "../home-page.css";
import { microcopy } from "../home-page.css";
import { Answered } from "./answered";
import { cta } from "./cta.css";

export function ReturnVisit() {
	const todaysPrompt = createAsync(() => fetchDailyPrompt());
	const latest = createAsync(() => getLatestPrompt());

	return (
		<Show
			fallback={<Answered />}
			when={latest()?.prompt !== todaysPrompt()?.prompt}
		>
			<h1>Another crack in the ordinary.</h1>
			<Card>
				<h2>Today's disruption</h2>
				<hr class={styles.hr} />
				<p>{todaysPrompt()?.prompt}</p>
			</Card>
			<A class={cta()} href="/prompt" type="button">
				Disturb the ordinary
			</A>
			<div class={microcopy}>
				Each day offers one strange seed. Your task is simply to notice what
				grows.
			</div>
		</Show>
	);
}
