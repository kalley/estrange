import type { Handler } from "./types";

export const createPreventDefaultAction = (): Handler => (event) => {
	event.preventDefault();
	return null;
};
