import { isHTMLElement } from "../dom/utils";
import { normalizeInline, normalizeRootChild } from "../normalization";

// src/observers/mutation-observer.ts
export type MutationProcessorOptions = {
	onNormalize?: (node: Node) => void;
	shouldProcess?: (node: Node) => boolean;
};

export function createMutationProcessor(
	root: HTMLElement,
	processNodes: (nodes: Node[]) => void, // Editor decides if this is debounced
	options: MutationProcessorOptions = {},
) {
	const { onNormalize, shouldProcess } = options;

	let isRestoring = false;

	const observer = new MutationObserver((mutations) => {
		if (isRestoring) return;

		let didNormalize = false;
		const pendingMarkdown = new Set<Node>();

		for (const mut of mutations) {
			// Handle normalization
			for (const node of mut.addedNodes) {
				if (node.parentNode === root && normalizeRootChild(node)) {
					pause();
					didNormalize = true;
					onNormalize?.(node);
					resume();
					continue;
				}

				if (
					isHTMLElement(node) &&
					["B", "I"].includes(node.nodeName) &&
					normalizeInline(node)
				) {
					pause();
					didNormalize = true;
					onNormalize?.(node);
					resume();
				}
			}

			// Collect nodes for markdown processing
			if (
				!didNormalize &&
				mut.type === "characterData" &&
				mut.target.textContent
			) {
				if (shouldProcess?.(mut.target) !== false) {
					pendingMarkdown.add(mut.target);
				}
			}
		}

		if (didNormalize) return;

		if (pendingMarkdown.size > 0 && !isRestoring) {
			processNodes([...pendingMarkdown]);
		}
	});

	function start() {
		observer.observe(root, {
			subtree: true,
			characterData: true,
			childList: true,
			characterDataOldValue: true,
		});
	}

	function pause() {
		observer.disconnect();
	}

	function resume() {
		requestAnimationFrame(() => {
			observer.observe(root, {
				subtree: true,
				characterData: true,
				childList: true,
				characterDataOldValue: true,
			});
		});
	}

	function withPaused(fn: () => void) {
		pause();
		try {
			fn();
		} finally {
			resume();
		}
	}

	function setRestoring(value: boolean) {
		isRestoring = value;
	}

	function destroy() {
		observer.disconnect();
	}

	return {
		start,
		pause,
		resume,
		withPaused,
		setRestoring,
		destroy,
	};
}
