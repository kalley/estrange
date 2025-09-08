import { createAsync, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import {
	creativePromptCreate,
	fetchDailyPrompt,
	savePrompt,
} from "@/entities/creative-prompts";
import { Card } from "@/shared/ui/card/card";
import { Field } from "@/shared/ui/field";
import * as styles from "./home-page.css";
import { cta } from "./ui/cta.css";

const RESPONSE_PLACEHOLDER = `Your response…
a fragment, a question, a sketch, a refusal — it all counts.`;

export function RespondPage() {
	const navigate = useNavigate();
	const todaysPrompt = createAsync(() => fetchDailyPrompt());
	const [errors, setErrors] = createSignal<Record<string, string>>({});

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		if (!(event.target instanceof HTMLFormElement)) {
			return;
		}

		const values = Object.fromEntries(new FormData(event.target));

		const result = creativePromptCreate.safeParse({
			...values,
			prompt: todaysPrompt()?.prompt,
		});

		if (result.success) {
			await savePrompt(result.data);
			navigate("/", { replace: true });
		} else {
			const errors: Record<string, string> = {};

			for (const issue of result.error.issues) {
				errors[issue.path.join(".")] = issue.message;
			}

			setErrors(errors);
		}
	};

	return (
		<>
			<Card>
				<h2>Today's disruption</h2>
				<hr class={styles.hr} />
				<p>{todaysPrompt()?.prompt}</p>
			</Card>
			<form class={styles.form} onSubmit={handleSubmit}>
				<Field error={errors().response} label="Response">
					<textarea
						class={styles.responseArea}
						name="response"
						onKeyUp={() => setErrors((prev) => ({ ...prev, response: "" }))}
						placeholder={RESPONSE_PLACEHOLDER}
					></textarea>
				</Field>
				<button class={cta()} type="submit">
					Submit
				</button>
			</form>
		</>
	);
}
