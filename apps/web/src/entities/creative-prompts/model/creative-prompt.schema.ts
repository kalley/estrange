import { z } from "zod";

function generateSyncId() {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const Stroke = z.object({
	pathData: z.string().min(1),
	timestamp: z.number().positive(),
	duration: z.number().positive(),
	color: z.object({
		r: z.number().min(0).max(255),
		g: z.number().min(0).max(255),
		b: z.number().min(0).max(255),
		a: z.number().min(0).max(1),
	}),
	width: z.number().min(1),
});

const creativePrompt = z.object({
	id: z.number().positive(),
	sync_id: z
		.string()
		.length(32)
		.regex(/^[0-9a-f]+$/)
		.default(generateSyncId()),
	created_at: z.iso.datetime().default(() => new Date().toISOString()),
	modified_at: z.iso.datetime().default(() => new Date().toISOString()),
	prompt: z.string().min(1),
	prompt_tags: z.array(z.string().trim().min(1).max(50)).default([]),
	response: z
		.string()
		.min(1, "Silence is also a response, but not today")
		.nullable()
		.optional(),
	drawing_vector: z.array(Stroke).nullable().optional(),
	drawing_preview: z.string().nullable().optional(),
	metadata: z.record(z.string(), z.unknown()).default({}),
});

export const creativePromptCreate = creativePrompt
	.omit({
		id: true,
	})
	.refine(
		(data) =>
			data.response != null ||
			(data.drawing_vector != null && data.drawing_vector.length > 0),
		{
			message: "Either response or drawing_vector is required",
			path: ["response"], // you could also set ["drawing_vector"], but this gives a single clear error path
		},
	);

export type CreativePrompt = z.infer<typeof creativePrompt>;
