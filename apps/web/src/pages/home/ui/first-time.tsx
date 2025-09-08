import { A } from "@solidjs/router";
import { microcopy } from "../home-page.css";
import { cta } from "./cta.css";

export function FirstTime() {
	return (
		<>
			<h1>Nothing ordinary survives here.</h1>
			<A class={cta({ first: true })} href="/prompt" type="button">
				Disturb the ordinary
			</A>
			<div class={microcopy}>
				Treat it like a mirror in a funhouse — strange, distorted, revealing.
			</div>
		</>
	);
}
