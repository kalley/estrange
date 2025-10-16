import { ZWS } from "../../../src/dom/zw-utils";
import { normalizeFragmentZWS } from "../../../src/normalization/fragment-zws";

const createRoot = (innerHTML: string) => {
	const fragment = document.createElement("div");

	fragment.innerHTML = innerHTML;

	return fragment;
};

describe("normalizeFragmentZWS", () => {
	it("correctly normalizes text", () => {
		const div = createRoot("HelloWorld");

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(`${ZWS}HelloWorld`);
	});

	it("normalizes multiple paragraphs", () => {
		const div = createRoot("<p></p><p></p>");

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(`<p>${ZWS}</p><p>${ZWS}</p>`);
	});

	it("normalizes a series of inlines", () => {
		const div = createRoot(
			"<p><strong>Hello</strong> <strong><em>World</em></strong></p>",
		);

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(
			`<p>${ZWS}<strong>${ZWS}Hello</strong>${ZWS} <strong>${ZWS}<em>${ZWS}World</em>${ZWS}</strong>${ZWS}</p>`,
		);
	});

	it("normalizes inlines with text before and after", () => {
		const div = createRoot("<p>That is a <strong>bold</strong> statement.</p>");

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(
			`<p>${ZWS}That is a <strong>${ZWS}bold</strong>${ZWS} statement.</p>`,
		);
	});

	it("is idempotent", () => {
		const div = createRoot("<p><strong>Hello</strong> world</p>");
		normalizeFragmentZWS(div);
		const first = div.innerHTML;
		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(first);
	});

	it("does not add duplicate ZWS if already normalized", () => {
		const div = createRoot(`<p>${ZWS}Hello</p>`);
		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(`<p>${ZWS}Hello</p>`);
	});

	it("handles empty fragments gracefully", () => {
		const div = createRoot("");

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe("");
	});

	it("normalizes whitespace-only nodes", () => {
		const div = createRoot("<p>   </p>");

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toBe(`<p>${ZWS}   </p>`);
	});

	it("handles deeply nested inline elements", () => {
		const div = createRoot("<p><em><strong><code>Hi</code></strong></em></p>");

		normalizeFragmentZWS(div);
		expect(div.innerHTML).toContain(
			`<p>${ZWS}<em>${ZWS}<strong>${ZWS}<code>${ZWS}Hi</code>${ZWS}</strong>${ZWS}</em>${ZWS}</p>`,
		);
	});
});
