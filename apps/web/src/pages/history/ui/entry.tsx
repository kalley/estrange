import type { Setter } from "solid-js";
import type { CreativePrompt } from "@/entities/creative-prompts";
import { useModal } from "@/shared/contexts/modal-context";
import { Card } from "@/shared/ui/card";
import { button, entry } from "./entry.css";

const formatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
});

export function Entry(props: {
	prompt: CreativePrompt;
	setSelectedEntry: Setter<CreativePrompt | null>;
}) {
	const { openPrompt } = useModal();

	return (
		<li>
			<Card class={entry}>
				<time datetime={props.prompt.created_at}>
					{formatter.format(new Date(props.prompt.created_at))}
				</time>
				<h3>{props.prompt.prompt}</h3>
				<button
					class={button}
					onClick={() => {
						props.setSelectedEntry(props.prompt);
						openPrompt();
					}}
					type="button"
				>
					See your response
				</button>
			</Card>
		</li>
	);
}
