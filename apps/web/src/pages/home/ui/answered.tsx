import { A } from "@solidjs/router";
import { useModal } from "@/shared/contexts/modal-context";
import { microcopy } from "../home-page.css";
import { body, link, linkList } from "./answered.css";

export function Answered() {
	const { openPrompt } = useModal();

	return (
		<>
			<h1>Today is complete.</h1>
			<p class={body}>
				Your disruption has been captured. Tomorrow, another door.
			</p>
			<ul class={linkList}>
				<li>
					<button class={link} onClick={openPrompt} type="button">
						View Response
					</button>
				</li>
				<li>
					<A class={link} href="/history">
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
