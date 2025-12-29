import { editor } from "./markdown-content.css";

export function MarkdownContent(props: {
	autofocus?: boolean;
	class?: string;
	contentEditable?: boolean;
	placeholder?: string;
	ref?: HTMLDivElement;
}) {
	return (
		/* biome-ignore lint/a11y/useSemanticElements: contentEditable div is appropriate for rich text editor */
		<div
			autofocus={props.autofocus}
			class={`markdown-content ${editor} ${props.class}`}
			data-placeholder={props.placeholder}
			ref={props.ref}
			contentEditable={props.contentEditable}
			role="textbox"
			tabIndex={props.contentEditable ? 0 : undefined}
		/>
	);
}
