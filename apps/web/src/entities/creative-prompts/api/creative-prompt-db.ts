import { query } from "@solidjs/router";
import { type DBSchema, openDB } from "idb";
import type { CreativePrompt } from "../model/creative-prompt.schema";

interface CreativePromptsDB extends DBSchema {
	prompts: {
		key: string; // sync_id
		value: CreativePrompt & { id: number };
		indexes: { "by-created-at": string };
	};
	counters: {
		key: string;
		value: number;
	};
}

const dbPromise = openDB<CreativePromptsDB>("creative_prompts_db", 1, {
	upgrade(db) {
		if (!db.objectStoreNames.contains("prompts")) {
			const store = db.createObjectStore("prompts", {
				keyPath: "sync_id",
			});
			store.createIndex("by-created-at", "created_at");
		}
		if (!db.objectStoreNames.contains("counters")) {
			db.createObjectStore("counters");
		}
	},
});

async function getNextId(): Promise<number> {
	const db = await dbPromise;
	const tx = db.transaction("counters", "readwrite");
	const store = tx.objectStore("counters");
	const lastId = (await store.get("promptId")) || 0;
	const nextId = lastId + 1;
	await store.put(nextId, "promptId");
	await tx.done;
	return nextId;
}

export async function savePrompt(prompt: Omit<CreativePrompt, "id">) {
	const db = await dbPromise;

	// If the prompt already exists, keep the existing id
	const existing = await db.get("prompts", prompt.sync_id);
	const id = existing?.id ?? (await getNextId());

	const toStore: CreativePrompt & { id: number } = { ...prompt, id };
	await db.put("prompts", toStore);
	return toStore;
}

async function fetchAllPrompts(): Promise<CreativePrompt[]> {
	const db = await dbPromise;
	const tx = db.transaction("prompts", "readonly");
	const store = tx.objectStore("prompts");
	const index = store.index("by-created-at");

	const results: CreativePrompt[] = [];

	let cursor = await index.openCursor(null, "prev");

	while (cursor) {
		results.push(cursor.value);
		cursor = await cursor.continue();
	}

	await tx.done;
	return results;
}

export const getAllPrompts = query(() => fetchAllPrompts(), "allPrompts");

/** Export all prompts as JSON string */
export async function exportPrompts(): Promise<string> {
	const all = await fetchAllPrompts();
	return JSON.stringify(all, null, 2);
}

/** Import prompts from JSON string */
export async function importPrompts(json: string) {
	const prompts: (CreativePrompt & { id?: number })[] = JSON.parse(json);
	for (const p of prompts) {
		// Ensure numeric id is set, use counter if missing
		if (!p.id) p.id = await getNextId();
		await savePrompt(p);
	}
}

async function findLatestPrompt(): Promise<CreativePrompt | null> {
	const db = await dbPromise;
	const tx = db.transaction("prompts", "readonly");
	const store = tx.objectStore("prompts");
	const index = store.index("by-created-at");

	// openCursor with "prev" direction gives newest first
	const cursor = await index.openCursor(null, "prev");
	const latest = cursor?.value;
	await tx.done;
	return latest ?? null;
}

export const getLatestPrompt = query(() => findLatestPrompt(), "latestPrompt");
