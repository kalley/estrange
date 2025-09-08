/** biome-ignore-all lint/a11y/noLabelWithoutControl: I'm expecting children to be an input */
import type { JSX, ParentProps } from "solid-js";
import * as styles from "./field.css";

export function Field(
	props: ParentProps<{
		description?: JSX.Element;
		error?: JSX.Element;
		label: JSX.Element;
	}>,
) {
	return (
		<label class={styles.field}>
			<div>{props.label}</div>
			{props.children}
			<p class={styles.descriptor({ error: !!props.error })}>
				{props.error ? props.error : (props.description ?? " ")}
			</p>
		</label>
	);
}
