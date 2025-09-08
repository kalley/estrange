import { A } from "@solidjs/router";
import {
	ClockIconOutline,
	HomeIconOutline,
	WindowIconOutline,
} from "@/shared/icons";
import { bottomNav } from "./bottom-nav.css";
import { navButton, navButtonActive } from "./bottom-nav-button.css";

export function BottomNav() {
	return (
		<div class={bottomNav}>
			<A href="/" activeClass={navButtonActive} class={navButton} end>
				<HomeIconOutline title="Home" />
				Home
			</A>
			<A href="/history" activeClass={navButtonActive} class={navButton}>
				<ClockIconOutline title="History" />
				History
			</A>
			<A href="/about" activeClass={navButtonActive} class={navButton}>
				<WindowIconOutline title="About" />
				About
			</A>
		</div>
	);
}
