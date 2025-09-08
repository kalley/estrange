import type { ParentProps } from "solid-js";
import { GlitchyText } from "@/shared/ui/glitchy-text";
import logo from "../../../../../../assets/estrange-logo.svg";
import { BottomNav } from "../bottom-nav";
import * as styles from "./layout.css";

export function Layout(props: ParentProps) {
	return (
		<div class={styles.app}>
			<header class={styles.header}>
				<div class={styles.heading}>
					<img class={styles.logo} src={logo} alt="Estrange" />
					<GlitchyText text="estrange" />
				</div>
				<h2 class={styles.subtitle}>Surrender to strangeness</h2>
			</header>
			<main class={styles.content}>{props.children}</main>
			<BottomNav />
		</div>
	);
}
