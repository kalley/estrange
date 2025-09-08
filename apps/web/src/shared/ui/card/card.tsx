import type { ParentProps } from "solid-js";
import * as styles from "./card.css.ts";

export function Card(props: ParentProps) {
	return <div class={styles.card}>{props.children}</div>;
}
