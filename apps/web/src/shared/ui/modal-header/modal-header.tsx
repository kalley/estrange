import { CrossbonesIcon, SuitcaseIcon } from "@estrange/liminal-icons-solid";
import type { ParentProps } from "solid-js";
import { useModal } from "@/shared/contexts/modal-context";
import { button, header, title } from "./modal-header.css";

export function ModalHeader(props: ParentProps<{ canExport?: boolean }>) {
	const { closePrompt } = useModal();

	return (
		<header class={header}>
			<h2 class={title}>{props.children}</h2>
			{props.canExport ? (
				<button class={button} type="button">
					<SuitcaseIcon size={48} title="Copy to Markdown" />
				</button>
			) : null}
			<button class={button} onClick={closePrompt} type="button">
				<CrossbonesIcon size={48} title="Close" />
			</button>
		</header>
	);
}
