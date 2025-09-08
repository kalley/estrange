import { z } from "zod";

export const DailyPromptSchema = z.object({
	prompt: z.string().min(1),
	tags: z.array(z.string().min(1).max(50)),
	generated_at: z.iso.datetime(),
	id: z.string(),
	version: z.string().min(1).max(50),
});

export type DailyPrompt = z.infer<typeof DailyPromptSchema>;
