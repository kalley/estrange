import type { ParentProps } from "solid-js";
import * as styles from "./home-page.css";

export function HomePage(props: ParentProps) {
	return <div class={styles.container}>{props.children}</div>;
}
