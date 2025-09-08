import { A } from "@solidjs/router";
import { microcopy } from "../home-page.css";
import * as styles from "./answered.css";

export function Answered() {
	return (
		<>
			<h1>Today is complete.</h1>
			<p class={styles.body}>
				Your disruption has been captured. Tomorrow, another door.
			</p>
			<ul class={styles.linkList}>
				<li>
					<A class={styles.link} href="/response">
						View Response
					</A>
				</li>
				<li>
					<A class={styles.link} href="/history">
						Browse history
					</A>
				</li>
			</ul>
			<div class={microcopy}>
				We don’t do streaks. Strangeness waits patiently.
			</div>
		</>
	);
}
