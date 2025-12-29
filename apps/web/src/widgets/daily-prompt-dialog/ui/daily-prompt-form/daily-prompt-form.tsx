import { BowIcon } from "@estrange/liminal-icons-solid";
import type { AccessorWithLatest } from "@solidjs/router";
import { createSignal } from "solid-js";
import {
	clearDraft,
	creativePromptCreate,
	savePrompt,
} from "@/entities/creative-prompts";
import type { DailyPrompt } from "@/entities/creative-prompts/model/daily-prompt.schema";
import { useDraftWriter } from "@/shared/contexts/draft/draft-context";
import { Field } from "@/shared/ui/field";
import { MarkdownEditor } from "@/shared/ui/markdown-editor";
import { debounce } from "@/shared/utils";
import { fab, field, form, response } from "./daily-prompt-form.css";

const FORM_ID = "daily-prompt-form";
const PLACEHOLDER = `Your response…
a fragment, a question, a sketch, a refusal — it all counts.`;

export function DailyPromptForm(props: {
	onSubmit: () => void;
	todaysPrompt: AccessorWithLatest<DailyPrompt | null | undefined>;
}) {
	const [errors, setErrors] = createSignal<Record<string, string>>({});
	const { draft, updateDraft } = useDraftWriter();
	const debouncedAutoSave = debounce(updateDraft, 500);

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		if (!(event.target instanceof HTMLFormElement)) {
			return;
		}

		const values = Object.fromEntries(new FormData(event.target));
		const result = creativePromptCreate.safeParse({
			...values,
			prompt: props.todaysPrompt()?.prompt,
			prompt_tags: props.todaysPrompt()?.tags,
		});

		if (result.success) {
			await savePrompt(result.data);
			props.onSubmit();
			clearDraft();
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
			<form class={form} id={FORM_ID} onSubmit={handleSubmit}>
				<Field
					class={field}
					error={errors().response}
					hideLabel
					label="Response"
				>
					<MarkdownEditor
						aria-label="Response"
						autofocus
						class={response}
						name="response"
						onContentChange={(value) => {
							const trimmed = value.trim();
							if (trimmed.length > 0) {
								setErrors({});
							}
							debouncedAutoSave(trimmed);
						}}
						placeholder={PLACEHOLDER}
						defaultValue={draft()}
					/>
				</Field>
			</form>
			<button class={fab} form={FORM_ID} type="submit">
				<BowIcon size={64} title="Log" />
			</button>
		</>
	);
}
