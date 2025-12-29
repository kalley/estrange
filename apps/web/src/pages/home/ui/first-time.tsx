import { header, list } from "./first-time.css";

export function FirstTime() {
	return (
		<>
			<h1 class={header}>Philosophy</h1>
			<p>
				Estrange offers daily creative disruption: unexpected prompts designed
				to break your routine thinking patterns. This isn't about producing
				polished work or building a streak. It's about surrendering to
				strangeness and seeing where unfamiliar thinking takes you.
			</p>
			<h2 class={header}>How It Works</h2>
			<ol class={list}>
				<li>Receive a daily prompt that challenges familiar patterns</li>
				<li>Respond with whatever comes to mind; no pressure, no audience</li>
				<li>Return tomorrow to do it again</li>
			</ol>
		</>
	);
}
