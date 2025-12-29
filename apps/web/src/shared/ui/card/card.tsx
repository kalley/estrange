import type { ParentProps } from "solid-js";
import * as styles from "./card.css";

export function Card(props: ParentProps<{ class?: string }>) {
	return (
		<div class={`${styles.card} ${props.class ?? ""}`}>{props.children}</div>
	);
}
