import { renderMarkdown } from "@estrange/ligature";
import { createEffect, on } from "solid-js";
import type { CreativePrompt } from "@/entities/creative-prompts";
import { useModal } from "@/shared/contexts/modal-context";
import { MarkdownContent } from "../markdown-content";
import { ModalHeader } from "../modal-header/modal-header";
import { content, dialog } from "./artifact.css";

export function Artifact(props: {
	entry: CreativePrompt | null | undefined;
	onClose: () => void;
}) {
	const { isOpen, closePrompt, trigger } = useModal();
	let dialogRef!: HTMLDialogElement;
	let contentRef!: HTMLDivElement;
	let currentAnimation: Animation | undefined;

	createEffect(
		on(
			() => isOpen(),
			async (open) => {
				if (open) {
					contentRef.appendChild(renderMarkdown(props.entry?.response ?? ""));
					animateIn();
				} else {
					await animateOut();
					trigger("close");
					contentRef.innerHTML = "";
				}
			},
			{ defer: true },
		),
	);

	function animateIn() {
		dialogRef.showModal(); // Key difference - modal behavior

		currentAnimation = dialogRef.animate(
			[
				{ opacity: 0, transform: "translateY(-10px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{
				duration: 150,
				easing: "ease-out",
				fill: "forwards",
			},
		);
	}

	async function animateOut() {
		if (!dialogRef) return;

		currentAnimation = dialogRef.animate(
			[
				{ opacity: 1, transform: "translateY(0)" },
				{ opacity: 0, transform: "translateY(-10px)" },
			],
			{ duration: 150, easing: "ease-in", fill: "forwards" },
		);

		await currentAnimation.finished;
		dialogRef.close();
	}

	function handleCancel(event: Event) {
		event.preventDefault();
		closePrompt();
	}

	return (
		<dialog class={dialog} ref={dialogRef} onCancel={handleCancel}>
			<ModalHeader canExport>{props.entry?.prompt}</ModalHeader>
			<MarkdownContent class={content} ref={contentRef} />
		</dialog>
	);
}
