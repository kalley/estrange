import { A } from "@solidjs/router";
import { useDailyPrompt } from "@/entities/creative-prompts";
import { cta } from "@/shared/styles/cta.css";
import { Card } from "@/shared/ui/card";
import * as styles from "../home-page.css";
import { microcopy } from "../home-page.css";

export function ReturnVisit() {
	const todaysPrompt = useDailyPrompt();

	return (
		<>
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
		</>
	);
}
