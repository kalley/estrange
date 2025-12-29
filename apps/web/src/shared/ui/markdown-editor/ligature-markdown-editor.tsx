import { createEditor } from "@estrange/ligature";
import { createSignal, onCleanup, onMount } from "solid-js";
import { debounce } from "@/shared/utils";
import { MarkdownContent } from "../markdown-content";

export const MarkdownEditor = (props: {
	autofocus?: boolean;
	class?: string;
	name: string;
	placeholder?: string;
	defaultValue?: string;
	debounceMs?: number;
	onContentChange?: (value: string) => void;
	onEditorReady?: (editor: ReturnType<typeof createEditor>) => void;
	onEditorDestroy?: (editor: ReturnType<typeof createEditor>) => void;
}) => {
	let editorRef!: HTMLDivElement;
	const editor = createEditor();
	const [content, setContent] = createSignal(props.defaultValue ?? "");

	onMount(() => {
		editor.attach(editorRef, content());

		// Use custom events to communicate changes
		// This approach doesn't require modifying your editor
		const handleEditorChange = () => {
			const markdown = editor.getMarkdown();
			props.onContentChange?.(markdown);
			setContent(markdown);
		};

		// Listen for any input event on the editor
		// This is more efficient than MutationObserver for change detection
		const handleInput = debounce(handleEditorChange, props.debounceMs || 60);
		editorRef.addEventListener("input", handleInput);

		// Also listen for keyboard events that might not trigger input
		const handleKeyUp = debounce(handleEditorChange, props.debounceMs || 60);
		editorRef.addEventListener("keyup", handleKeyUp);

		onCleanup(() => {
			editorRef.removeEventListener("input", handleInput);
			editorRef.removeEventListener("keyup", handleKeyUp);
			handleInput.cancel?.();
			handleKeyUp.cancel?.();
			editor?.destroy();
		});

		props.onEditorReady?.(editor);
	});

	return (
		<>
			<MarkdownContent
				autofocus={true}
				class={props.class}
				contentEditable={true}
				placeholder={props.placeholder}
				ref={editorRef}
			/>
			<input type="hidden" name={props.name} value={content()} />
		</>
	);
};
