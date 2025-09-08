import { createAsync, useNavigate } from "@solidjs/router";
import { fetchDailyPrompt } from "@/entities/creative-prompts";
import { Card } from "@/shared/ui/card/card";
import * as styles from "./home-page.css";
import { cta } from "./ui/cta.css";

export function PromptPage() {
	const todaysPrompt = createAsync(() => fetchDailyPrompt());
	const navigate = useNavigate();

	return (
		<>
			<Card>
				<h2>Today's disruption</h2>
				<hr class={styles.hr} />
				<p>{todaysPrompt()?.prompt}</p>
			</Card>
			<button class={cta()} onClick={() => navigate("/respond")} type="button">
				Respond now
			</button>
			<div class={styles.microcopy}>
				You’ll keep the same disruption until tomorrow. Strangeness works best
				with patience.
			</div>
		</>
	);
}
