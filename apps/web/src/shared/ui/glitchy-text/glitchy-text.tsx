import { createSignal, For, onCleanup, onMount } from "solid-js";
import * as styles from "./glitchy-text.css";

export const GlitchyText = (props: { text: string }) => {
	const chars = props.text.split("").map((char) => ({
		text: char,
		delay: Math.random(),
		glitchType: createSignal<undefined | "shiftLeft" | "shiftRight">(undefined),
	}));

	let intervalId = 0;

	const triggerGlitch = () => {
		chars.forEach((item, i) => {
			const [glitchType, setGlitchType] = item.glitchType;
			const prevItem = chars.at(i - 1);

			if (prevItem?.glitchType[0]() !== undefined || glitchType() !== undefined)
				return;

			const glitchTypeRand = Math.random();
			if (glitchTypeRand < 0.25) setGlitchType("shiftLeft");
			if (glitchTypeRand > 0.75) setGlitchType("shiftRight");
		});
	};

	onMount(() => {
		intervalId = window.setInterval(triggerGlitch, Math.random() * 8000 + 4000);
	});

	onCleanup(() => clearInterval(intervalId));

	return (
		<span class={styles.container}>
			<For each={chars}>
				{(char, index) => {
					return (
						<span
							class={styles.glitchText({
								glitchType: char.glitchType[0](),
							})}
							data-char={char.text}
							data-index={index()}
							onTransitionEnd={() => char.glitchType[1](undefined)}
							style={{ "--delay": `${char.delay}s` }}
						>
							{char.text}
						</span>
					);
				}}
			</For>
		</span>
	);
};
