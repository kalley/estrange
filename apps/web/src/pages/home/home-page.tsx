import { Match, Switch } from "solid-js";
import { useResponseState } from "@/entities/creative-prompts";
import * as styles from "./home-page.css";
import { Answered } from "./ui/answered";
import { FirstTime } from "./ui/first-time";
import { ReturnVisit } from "./ui/return-visit";

export function HomePage() {
	const responseState = useResponseState(); // your derived signal

	return (
		<div class={styles.container}>
			<Switch>
				<Match when={responseState() === "first-time"}>
					<FirstTime />
				</Match>
				<Match when={responseState() === "prompt-ready"}>
					<ReturnVisit />
				</Match>
				<Match when={responseState() === "response-in-progress"}>
					You've started a response
				</Match>
				<Match when={responseState() === "completed-today"}>
					<Answered />
				</Match>
			</Switch>
		</div>
	);
}
