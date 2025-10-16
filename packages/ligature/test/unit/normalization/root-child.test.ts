import { isHTMLElement } from "../../../src/dom/utils";
import { ZWS } from "../../../src/dom/zw-utils";
import { normalizeRootChild } from "../../../src/normalization/root-child";

describe("normalizeRootChild", () => {
	it("converts a textNode into a paragraph", () => {
		const p = normalizeRootChild(document.createTextNode("T"));

		assert(isHTMLElement(p), "p should be an HTMLElement");
		expect(p.textContent).toBe(`${ZWS}T`);
		expect(p.tagName).toBe("P");
	});

	it("converts a div into a paragraph", () => {
		const div = document.createElement("div");
		div.textContent = "T";
		const p = normalizeRootChild(div);

		assert(isHTMLElement(p), "p should be an HTMLElement");
		expect(p.textContent).toBe(`${ZWS}T`);
		expect(p.tagName).toBe("P");
	});

	it("removes break children", () => {
		const root = document.createElement("p");
		root.appendChild(document.createElement("br"));
		const p = normalizeRootChild(root);

		assert(isHTMLElement(p), "p should be an HTMLElement");
		expect(p.textContent).toBe(`${ZWS}`);
		expect(p.tagName).toBe("P");
	});
});
