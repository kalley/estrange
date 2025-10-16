import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import {
	createMutationProcessor,
	type MutationProcessorOptions,
} from "../../../src/observers/mutation-observer";

describe("createMutationProcessor", () => {
	let container: HTMLElement;

	function createProcessor(options: Partial<MutationProcessorOptions> = {}) {
		const processedNodes: Node[][] = [];
		const processor = createMutationProcessor(
			container,
			(nodes: Node[]) => {
				processedNodes.push(nodes);
			},
			options,
		);

		processor.start();

		return {
			cleanup: () => {
				processor.destroy();
			},
			processedNodes,
			processor,
		};
	}

	beforeEach(() => {
		container = document.createElement("div");
		container.contentEditable = "true";
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it("detects typing", async () => {
		const { cleanup, processedNodes } = createProcessor();
		const user = userEvent.setup();

		const p = document.createElement("p");
		p.textContent = "​"; // Start with ZWS
		container.appendChild(p);

		// Focus and type
		container.focus();
		await user.type(container, "hello");

		// Should have captured text nodes
		expect(processedNodes.length).toBeGreaterThan(0);
		expect(
			processedNodes.flat().some((node) => node.textContent?.includes("hello")),
		).toBe(true);
		cleanup();
	});

	it("detects markdown patterns", async () => {
		const { cleanup, processedNodes } = createProcessor();
		const user = userEvent.setup();

		const p = document.createElement("p");
		p.textContent = "​";
		container.appendChild(p);

		container.focus();
		await user.type(container, "**hello**");

		// Should detect the ** markers
		const lastProcessed = processedNodes[processedNodes.length - 1];
		expect(lastProcessed.some((node) => node.textContent?.includes("**"))).toBe(
			true,
		);
		cleanup();
	});

	it("withPaused prevents processing", async () => {
		const { cleanup, processedNodes, processor } = createProcessor();
		const p = document.createElement("p");
		p.textContent = "​";
		container.appendChild(p);

		processor.withPaused(() => {
			// Manually change content
			p.textContent = "changed";
		});

		// Should not have processed
		expect(processedNodes.length).toBe(0);
		cleanup();
	});

	it("normalizes direct text node additions", async () => {
		const { cleanup, processedNodes } = createProcessor();

		const textNode = document.createTextNode("hello");
		container.appendChild(textNode);

		await waitFor(() => {
			expect(processedNodes.length).toBeGreaterThan(0);
		});

		expect(container.querySelector("p")).toBeTruthy();
		cleanup();
	});

	it("does not process during restore", async () => {
		const { cleanup, processedNodes, processor } = createProcessor();
		const user = userEvent.setup();

		const p = document.createElement("p");
		p.textContent = "​";
		container.appendChild(p);

		await waitFor(() => {
			expect(container.querySelector("p")).toBeTruthy();
		});

		processor.setRestoring(true);

		container.focus();
		await user.type(container, "hello");

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(processedNodes.length).toBe(0);

		processor.setRestoring(false);
		cleanup();
	});
});
