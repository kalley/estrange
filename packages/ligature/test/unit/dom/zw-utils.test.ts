import {
	ensureBlockHasLeadingZWS,
	getZWSCount,
	hasZWS,
	isOnlyZWS,
	normalizeZWS,
	startsWithZWS,
	stripZWS,
	ZWS,
} from "../../../src/dom/zw-utils";

describe("ZWS utilities", () => {
	describe("getZWSCount", () => {
		it("returns 0 when no ZWS present", () => {
			expect(getZWSCount("hello")).toBe(0);
		});

		it("returns correct count when ZWS present multiple times", () => {
			expect(getZWSCount(`${ZWS}a${ZWS}${ZWS}`)).toBe(3);
		});
	});

	describe("hasZWS", () => {
		it("returns true if string contains ZWS", () => {
			expect(hasZWS(`a${ZWS}b`)).toBe(true);
		});

		it("returns false if string does not contain ZWS", () => {
			expect(hasZWS("abc")).toBe(false);
		});
	});

	describe("startsWithZWS", () => {
		it("returns true if string starts with ZWS", () => {
			expect(startsWithZWS(`${ZWS}abc`)).toBe(true);
		});

		it("returns false if string does not start with ZWS", () => {
			expect(startsWithZWS(`abc${ZWS}`)).toBe(false);
		});
	});

	describe("stripZWS", () => {
		it("removes all ZWS from the string", () => {
			expect(stripZWS(`${ZWS}a${ZWS}b${ZWS}`)).toBe("ab");
		});

		it("returns string unchanged if no ZWS present", () => {
			expect(stripZWS("abc")).toBe("abc");
		});
	});

	describe("normalizeZWS", () => {
		it("returns a single ZWS if input is empty", () => {
			expect(normalizeZWS("")).toBe(ZWS);
		});

		it("prepends a ZWS and removes any existing ZWS inside", () => {
			expect(normalizeZWS(`${ZWS}abc${ZWS}`)).toBe(`${ZWS}abc`);
		});
	});

	describe("isOnlyZWS", () => {
		it("returns true if string contains only ZWS characters", () => {
			expect(isOnlyZWS(ZWS)).toBe(true);
			expect(isOnlyZWS(`${ZWS}${ZWS}${ZWS}`)).toBe(true);
		});

		it("returns false if string contains other characters", () => {
			expect(isOnlyZWS(`${ZWS}a${ZWS}`)).toBe(false);
		});
	});

	describe("ensureBlockHasLeadingZWS", () => {
		it("inserts a ZWS text node if the block has no text node", () => {
			const block = document.createElement("div");
			const child = document.createElement("span");
			block.appendChild(child);

			ensureBlockHasLeadingZWS(block);

			expect(block.firstChild?.nodeType).toBe(Node.TEXT_NODE);
			expect(block.firstChild?.textContent).toBe(ZWS);
		});

		it("prepends ZWS to an existing text node", () => {
			const block = document.createElement("div");
			block.appendChild(document.createTextNode("abc"));

			ensureBlockHasLeadingZWS(block);

			expect(block.firstChild?.textContent).toBe(`${ZWS}abc`);
		});

		it("normalizes existing ZWS-only text node to a single ZWS", () => {
			const block = document.createElement("div");
			block.appendChild(document.createTextNode(`${ZWS}${ZWS}${ZWS}`));

			ensureBlockHasLeadingZWS(block);

			expect(block.firstChild?.textContent).toBe(ZWS);
		});

		it("handles empty block gracefully", () => {
			const block = document.createElement("div");

			ensureBlockHasLeadingZWS(block);

			expect(block.firstChild?.nodeType).toBe(Node.TEXT_NODE);
			expect(block.firstChild?.textContent).toBe(ZWS);
		});
	});
});
