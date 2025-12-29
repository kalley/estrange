export function toggleInert(
	enable: boolean,
	selectors: string[] = ["main", "header", "nav"],
) {
	selectors.forEach((selector) => {
		const el = document.querySelector(selector);
		if (el instanceof HTMLElement) el.inert = enable;
	});
}
