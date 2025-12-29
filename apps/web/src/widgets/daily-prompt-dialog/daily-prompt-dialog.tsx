import { createAsync, revalidate } from "@solidjs/router";
import { createEffect, on, onMount, Show } from "solid-js";
import {
	getLatestPrompt,
	useDailyPrompt,
	useResponseState,
} from "@/entities/creative-prompts";
import { useModal } from "@/shared/contexts/modal-context";
import { toggleInert } from "@/shared/lib/modal";
import { Artifact } from "@/shared/ui/artifact";
import { ModalHeader } from "@/shared/ui/modal-header/modal-header";
import { content, dailyPrompt } from "./daily-prompt-dialog.css";
import { DailyPromptForm } from "./ui/daily-prompt-form/daily-prompt-form";

export function DailyPromptDialog() {
	const { isOpen, closePrompt, trigger } = useModal();
	const responseState = useResponseState();
	let dialogRef!: HTMLDialogElement;
	let currentAnimation: Animation | undefined;

	const todaysPrompt = useDailyPrompt();
	const latest = createAsync(() => getLatestPrompt());

	onMount(() => {
		if (isOpen()) {
			animateIn();
		}
	});

	createEffect(
		on(
			isOpen,
			async (open) => {
				if (open) {
					animateIn();
				} else {
					await animateOut();
					trigger("close");
				}
			},
			{ defer: true },
		),
	);

	function animateIn() {
		dialogRef.show();

		toggleInert(true);

		currentAnimation = dialogRef.animate(
			[
				{ transform: "translateY(calc(100% - 80px))" },
				{ transform: "translateY(-1px)" },
			],
			{
				duration: 350,
				easing: "cubic-bezier(0.32, 0.72, 0, 1)",
				fill: "forwards",
			},
		);
	}

	async function animateOut() {
		if (!dialogRef) return;

		dialogRef.blur();
		currentAnimation = dialogRef.animate(
			[
				{ transform: "translateY(-1px)" },
				{ transform: "translateY(calc(100% - 80px))" },
			],
			{ duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
		);

		await currentAnimation.finished;

		toggleInert(false);

		dialogRef.close();
	}

	function handleCancel(event: Event) {
		event.preventDefault();
		closePrompt();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") closePrompt();
	}

	createEffect(() => {
		if (isOpen()) {
			document.addEventListener("keydown", handleKeyDown);
		} else {
			document.removeEventListener("keydown", handleKeyDown);
		}
	});

	return (
		<Show
			fallback={
				<dialog ref={dialogRef} onCancel={handleCancel} class={dailyPrompt}>
					<div class={content({ isOpen: isOpen() })}>
						<ModalHeader>{todaysPrompt()?.prompt}</ModalHeader>
						<DailyPromptForm
							onSubmit={async () => {
								await revalidate("latestPrompt");
								closePrompt();
							}}
							todaysPrompt={todaysPrompt}
						/>
					</div>
				</dialog>
			}
			when={responseState() === "completed-today"}
		>
			<Artifact entry={latest()} onClose={() => {}} />
		</Show>
	);
}
