/** biome-ignore-all lint/a11y/noLabelWithoutControl: I'm expecting children to be an input */
import type { JSX, ParentProps } from "solid-js";
import { visuallyHidden } from "@/shared/styles";
import * as styles from "./field.css";

export function Field(
	props: ParentProps<{
		class?: string;
		description?: JSX.Element;
		error?: JSX.Element;
		hideLabel?: boolean;
		label: JSX.Element;
	}>,
) {
	return (
		<label class={`${styles.field} ${props.class ?? ""}`}>
			<div class={props.hideLabel ? visuallyHidden : ""}>{props.label}</div>
			{props.children}
			<p class={styles.descriptor({ error: !!props.error })}>
				{props.error ? props.error : (props.description ?? " ")}
			</p>
		</label>
	);
}
