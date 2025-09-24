import type { Handler } from "./types";

export const createActionRegistry = () => {
	const actions = new Map();

	return {
		register: (key: string, handler: Handler) => actions.set(key, handler),
		get: (key: string) => actions.get(key),
		has: (key: string) => actions.has(key),
		delete: (key: string) => actions.delete(key),
		entries: () => actions.entries(),
	};
};
