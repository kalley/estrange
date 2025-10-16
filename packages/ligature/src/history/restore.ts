import { isNode } from "../dom/utils";
import { createTextWalker, getDeepLastTextNode } from "../dom/walker";
import type { HistoryState, SelectionState } from "./history-manager";

// Helper: Get node and offset from physical offset
const getNodeAtOffset = (block: Node, targetOffset: number) => {
	const walker = createTextWalker(block);
	let currentOffset = 0;
	let node = walker.nextNode();

	while (node) {
		const nodeLength = node.textContent?.length || 0;

		if (targetOffset <= currentOffset + nodeLength) {
			return { node, offset: targetOffset - currentOffset };
		}

		currentOffset += nodeLength;
		node = walker.nextNode();
	}

	// Fallback: end of last text node
	const lastNode = getDeepLastTextNode(block);

	return {
		node: lastNode || block,
		offset: lastNode ? lastNode.textContent?.length || 0 : 0,
	};
};

export const restoreSelection = (
	editor: HTMLElement,
	selectionState: SelectionState,
) => {
	if (!selectionState) return false;

	const startBlock = editor.querySelector(
		`[data-block-id="${selectionState.blockId}"]`,
	);
	if (!startBlock) return false;

	const { node: startNode, offset: startOffset } = getNodeAtOffset(
		startBlock,
		selectionState.offset,
	);

	const range = document.createRange();

	if (selectionState.isRange && selectionState.endBlockId) {
		const endBlock = editor.querySelector(
			`[data-block-id="${selectionState.endBlockId}"]`,
		);
		if (!endBlock) return false;

		const { node: endNode, offset: endOffset } = getNodeAtOffset(
			endBlock,
			selectionState.endOffset || 0,
		);

		range.setStart(startNode, startOffset);
		range.setEnd(endNode, endOffset);
	} else {
		range.setStart(startNode, startOffset);
		range.collapse(true);
	}

	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	return true;
};

export function restoreEditorState(editor: HTMLElement, state: HistoryState) {
	// Handle deletions
	if (state.deletedBlockIds) {
		state.deletedBlockIds.forEach((blockId) => {
			const block = editor.querySelector(`[data-block-id="${blockId}"]`);
			block?.remove();
		});
	}

	// Restore/update blocks
	for (const snapshot of state.blocks) {
		const existing = editor.querySelector(
			`[data-block-id="${snapshot.blockId}"]`,
		) as HTMLElement | null;

		if (existing) {
			// Block exists - update if changed
			if (existing.outerHTML !== snapshot.html) {
				const temp = document.createElement("div");
				temp.innerHTML = snapshot.html;
				const newBlock = temp.firstChild;
				if (isNode(newBlock)) existing.replaceWith(newBlock);
			}
		} else {
			// This shouldn't happen in normal operation
			// But if it does, we need to recreate
			console.warn(`Block ${snapshot.blockId} not found, recreating`);
			const temp = document.createElement("div");
			temp.innerHTML = snapshot.html;
			const newBlock = temp.firstChild;
			if (isNode(newBlock)) editor.appendChild(newBlock); // Just append for now
		}
	}

	// Restore selection
	if (state.selection) {
		restoreSelection(editor, state.selection);
	}
}
