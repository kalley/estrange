import { LampIcon, MirrorIcon } from "@estrange/liminal-icons-solid";
import { A } from "@solidjs/router";
import { createEffect, createSignal, on } from "solid-js";
import { useModal } from "@/shared/contexts/modal-context";
import {
	bottomNav,
	fabWrap,
	navBackground,
	navButtons,
} from "./bottom-nav.css";
import { navButton, navButtonActive } from "./bottom-nav-button.css";
import { DailyPromptButton } from "./daily-prompt-button";

export function BottomNav() {
	const { isOpen } = useModal({
		on: {
			close: () => setBackgroundHidden(false),
		},
	});
	const [backgroundHidden, setBackgroundHidden] = createSignal(false);
	let fabRef: HTMLButtonElement | undefined;
	const navItemRefs: HTMLAnchorElement[] = [];

	createEffect(
		on(
			() => isOpen(),
			(isOpenValue) => {
				if (isOpenValue) {
					setBackgroundHidden(true);
					fabRef?.animate(
						[
							{
								transform: "rotate(0deg) scale(1)",
								opacity: 1,
							},
							{
								transform: "rotate(270deg) scale(0)",
								opacity: 0,
							},
						],
						{ duration: 400, easing: "ease-in", fill: "forwards" },
					);

					navItemRefs.forEach((item) => {
						item.animate([{ opacity: 1 }, { opacity: 0 }], {
							duration: 300,
							easing: "ease-out",
							fill: "forwards",
						});
					});
				} else {
					fabRef?.animate(
						[
							{
								transform: "rotate(270deg) scale(0)",
								opacity: 0,
							},
							{
								transform: "rotate(0deg) scale(1)",
								opacity: 1,
							},
						],
						{ duration: 400, easing: "ease-out", fill: "forwards" },
					);

					navItemRefs.forEach((item) => {
						item.animate([{ opacity: 0 }, { opacity: 1 }], {
							duration: 300,
							easing: "ease-out",
							fill: "forwards",
						});
					});
				}
			},
			{ defer: true },
		),
	);

	return (
		<nav class={bottomNav}>
			<div class={navBackground({ hidden: backgroundHidden() })} aria-hidden />
			<div class={navButtons}>
				<A
					href="/"
					activeClass={navButtonActive}
					class={navButton}
					end
					ref={(el) => navItemRefs.push(el)}
				>
					<LampIcon size={48} title="Home" />
				</A>
				<div class={fabWrap}>
					<DailyPromptButton ref={fabRef} />
				</div>
				<A
					href="/history"
					activeClass={navButtonActive}
					class={navButton}
					ref={(el) => navItemRefs.push(el)}
				>
					<MirrorIcon size={48} title="History" />
				</A>
			</div>
		</nav>
	);
}
