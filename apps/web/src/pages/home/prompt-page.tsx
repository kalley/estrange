import { useNavigate } from "@solidjs/router";
import todaysPrompt from "@/shared/assets/prompt.json";
import { Card } from "@/shared/ui/card/card";
import * as styles from "./home-page.css";
import { cta } from "./ui/cta.css";

export function PromptPage() {
	const navigate = useNavigate();

	return (
		<>
			<Card>
				<h2>Today's disruption</h2>
				<hr class={styles.hr} />
				<p>{todaysPrompt}</p>
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
