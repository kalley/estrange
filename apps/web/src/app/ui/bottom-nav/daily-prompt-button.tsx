import {
	BookCosmosIcon,
	BookEmptyIcon,
	BookSplatterIcon,
} from "@estrange/liminal-icons-solid";
import { Match, Suspense, Switch } from "solid-js";
import { useResponseState } from "@/entities/creative-prompts";
import { useModal } from "@/shared/contexts/modal-context";
import { dailyPromptButton } from "./daily-prompt-button.css";

export function DailyPromptButton(props: { ref?: HTMLButtonElement }) {
	const responseState = useResponseState();
	const dailyPrompt = useModal();

	return (
		<Suspense>
			<button
				class={dailyPromptButton()}
				onClick={() => {
					if (!dailyPrompt.isOpen()) {
						dailyPrompt.openPrompt();
					}
				}}
				type="button"
				ref={props.ref}
			>
				<Switch fallback={<BookEmptyIcon size={48} />}>
					<Match when={responseState() === "response-in-progress"}>
						<BookSplatterIcon size={48} />
					</Match>
					<Match when={responseState() === "completed-today"}>
						<BookCosmosIcon size={48} />
					</Match>
				</Switch>
			</button>
		</Suspense>
	);
}
