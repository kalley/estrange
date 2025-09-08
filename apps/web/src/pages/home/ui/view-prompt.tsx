import todaysPrompt from "@/shared/assets/prompt.json";
import { Card } from "@/shared/ui/card/card";
import * as styles from "../home-page.css";

export function ViewPrompt({ setView }: { setView: (view: string) => void }) {
	return (
		<>
			<Card>
				<h2>Today's disruption</h2>
				<hr class={styles.hr} />
				<p>{todaysPrompt}</p>
			</Card>
			<button
				class={styles.cta}
				onClick={() => setView("respond")}
				type="button"
			>
				Respond now
			</button>
			<div class={styles.microcopy}>
				You’ll keep the same disruption until tomorrow. Strangeness works best
				with patience.
			</div>
		</>
	);
}
