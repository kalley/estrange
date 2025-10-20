import { ZWS } from "../../../src/dom/zw-utils";
import { normalizeInline } from "../../../src/normalization";

describe("normalizeInline", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
		// Clear any selections
		window.getSelection()?.removeAllRanges();
	});

	describe("element conversion", () => {
		it("converts <b> to <strong>", () => {
			const b = document.createElement("b");
			b.textContent = "bold text";
			container.appendChild(b);

			const result = normalizeInline(b);

			expect(result).toBeInstanceOf(HTMLElement);
			expect(result?.tagName).toBe("STRONG");
			expect(result?.textContent).toBe(`${ZWS}bold text`);
			expect(container.querySelector("b")).toBeNull();
			expect(container.querySelector("strong")).toBe(result);
		});

		it("converts <i> to <em>", () => {
			const i = document.createElement("i");
			i.textContent = "italic text";
			container.appendChild(i);

			const result = normalizeInline(i);

			expect(result).toBeInstanceOf(HTMLElement);
			expect(result?.tagName).toBe("EM");
			expect(result?.textContent).toBe(`${ZWS}italic text`);
			expect(container.querySelector("i")).toBeNull();
			expect(container.querySelector("em")).toBe(result);
		});

		it("returns null for elements that don't need conversion", () => {
			const strong = document.createElement("strong");
			strong.textContent = "already correct";
			container.appendChild(strong);

			const result = normalizeInline(strong);

			expect(result).toBeNull();
			expect(container.querySelector("strong")).toBe(strong);
		});

		it("returns null for unknown elements", () => {
			const span = document.createElement("span");
			span.textContent = "span text";
			container.appendChild(span);

			const result = normalizeInline(span);

			expect(result).toBeNull();
		});
	});

	describe("content preservation", () => {
		it("preserves nested HTML structure", () => {
			const b = document.createElement("b");
			b.innerHTML = "bold <em>and italic</em> text";
			container.appendChild(b);

			const result = normalizeInline(b);

			expect(result?.innerHTML).toBe(
				`${ZWS}bold <em>${ZWS}and italic</em>${ZWS} text`,
			);
			const em = result?.querySelector("em");
			expect(em?.textContent).toBe(`${ZWS}and italic`);
		});

		it("preserves empty elements", () => {
			const b = document.createElement("b");
			b.innerHTML = "";
			container.appendChild(b);

			const result = normalizeInline(b);

			expect(result?.tagName).toBe("STRONG");
			expect(result?.innerHTML).toBe("");
		});

		it("preserves multiple nested elements", () => {
			const b = document.createElement("b");
			b.innerHTML = "<code>code</code> and <em>emphasis</em>";
			container.appendChild(b);

			const result = normalizeInline(b);

			expect(result?.querySelector("code")?.textContent).toBe(`${ZWS}code`);
			expect(result?.querySelector("em")?.textContent).toBe(`${ZWS}emphasis`);
		});
	});

	describe("selection handling", () => {
		it("selects all children of the replacement node", () => {
			const b = document.createElement("b");
			b.textContent = "select me";
			container.appendChild(b);

			const result = normalizeInline(b);

			const selection = window.getSelection();
			expect(selection?.rangeCount).toBe(1);

			const range = selection?.getRangeAt(0);
			expect(range?.startContainer).toBe(result);
			expect(range?.endContainer).toBe(result);
			expect(range?.toString()).toBe(`${ZWS}select me`);
		});

		it("handles selection when window.getSelection returns null", () => {
			const originalGetSelection = window.getSelection;
			window.getSelection = vi.fn(() => null);

			const b = document.createElement("b");
			b.textContent = "text";
			container.appendChild(b);

			// Should not throw
			expect(() => normalizeInline(b)).not.toThrow();

			window.getSelection = originalGetSelection;
		});
	});

	describe("ZWS normalization", () => {
		it("normalizes ZWS in text nodes within the parent block", () => {
			const p = document.createElement("p");
			const b = document.createElement("b");
			b.textContent = "bold";
			p.appendChild(document.createTextNode("before "));
			p.appendChild(b);
			p.appendChild(document.createTextNode(" after"));
			container.appendChild(p);

			normalizeInline(b);

			// After normalization, all text nodes should have leading ZWS
			const textNodes: Text[] = [];
			const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);

			while (walker.nextNode()) {
				textNodes.push(walker.currentNode as Text);
			}

			textNodes.forEach((textNode) => {
				expect(textNode.textContent).toMatch(/^​/); // Starts with ZWS
			});
		});

		it("handles blocks with multiple text nodes", () => {
			const p = document.createElement("p");
			const b = document.createElement("b");
			b.innerHTML = "text<em>nested</em>more";
			p.appendChild(document.createTextNode("start"));
			p.appendChild(b);
			p.appendChild(document.createTextNode("end"));
			container.appendChild(p);

			normalizeInline(b);

			// All text nodes should be normalized
			const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);

			while (walker.nextNode()) {
				const textNode = walker.currentNode as Text;
				expect(textNode.textContent).toMatch(/^​/);
			}
		});

		it("handles element without parent block", () => {
			const b = document.createElement("b");
			b.textContent = "orphan";
			// Not appended to container, so no parent

			// Should not throw even without parent block
			expect(() => normalizeInline(b)).toThrow();
		});

		it("normalizes ZWS when parent block is the container", () => {
			const b = document.createElement("b");
			b.textContent = "text";
			container.appendChild(document.createTextNode("before"));
			container.appendChild(b);
			container.appendChild(document.createTextNode("after"));

			normalizeInline(b);

			// Container itself acts as the block
			const walker = document.createTreeWalker(
				container,
				NodeFilter.SHOW_TEXT,
				null,
			);

			while (walker.nextNode()) {
				const textNode = walker.currentNode as Text;
				expect(textNode.textContent).toMatch(/^​/);
			}
		});
	});

	describe("edge cases", () => {
		it("handles deeply nested conversion targets", () => {
			const div = document.createElement("div");
			const p = document.createElement("p");
			const b = document.createElement("b");
			b.textContent = "deep";
			p.appendChild(b);
			div.appendChild(p);
			container.appendChild(div);

			const result = normalizeInline(b);

			expect(result?.tagName).toBe("STRONG");
			expect(p.querySelector("strong")).toBe(result);
		});

		it("handles consecutive conversions", () => {
			const b1 = document.createElement("b");
			b1.textContent = "first";
			const b2 = document.createElement("b");
			b2.textContent = "second";
			container.appendChild(b1);
			container.appendChild(b2);

			const result1 = normalizeInline(b1);
			const result2 = normalizeInline(b2);

			expect(result1?.tagName).toBe("STRONG");
			expect(result2?.tagName).toBe("STRONG");
			expect(container.querySelectorAll("strong")).toHaveLength(2);
			expect(container.querySelectorAll("b")).toHaveLength(0);
		});

		it("handles conversion of element with attributes", () => {
			const b = document.createElement("b");
			b.textContent = "styled";
			b.setAttribute("class", "highlight");
			b.setAttribute("data-test", "value");
			container.appendChild(b);

			const result = normalizeInline(b);

			// innerHTML preserves attributes on children but not the converted element
			expect(result?.tagName).toBe("STRONG");
			expect(result?.hasAttribute("class")).toBe(false);
			expect(result?.hasAttribute("data-test")).toBe(false);
		});

		it("handles text nodes with only ZWS", () => {
			const p = document.createElement("p");
			const b = document.createElement("b");
			b.textContent = "text";
			p.appendChild(document.createTextNode(ZWS));
			p.appendChild(b);
			p.appendChild(document.createTextNode(ZWS));
			container.appendChild(p);

			normalizeInline(b);

			// Should still normalize without errors
			const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);

			let count = 0;
			while (walker.nextNode()) {
				count++;
			}

			expect(count).toBeGreaterThan(0);
		});
	});
});
