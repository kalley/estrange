import { getClosestBlock, uniqueId } from "../core/utils";
import { isHTMLElement } from "../dom/utils";
import { createTextWalker } from "../dom/walker";
import type { BlockSnapshot, HistoryState } from "./history-manager";

// Helper: Get physical offset within a block
const getOffsetInBlock = (block: Node, container: Node, offset: number) => {
	const walker = createTextWalker(block);
	let totalOffset = 0;
	let node = walker.nextNode();

	while (node && node !== container) {
		totalOffset += node.textContent?.length || 0;
		node = walker.nextNode();
	}

	return totalOffset + offset;
};

export const captureSelection = (editor: HTMLElement) => {
	const selection = window.getSelection();
	if (!selection?.rangeCount) return null;

	const range = selection.getRangeAt(0);
	const startBlock = getClosestBlock(range.startContainer, editor);

	if (!startBlock?.dataset.blockId) return null;

	const offset = getOffsetInBlock(
		startBlock,
		range.startContainer,
		range.startOffset,
	);

	if (range.collapsed) {
		return {
			blockId: startBlock.dataset.blockId,
			offset,
			isRange: false,
		};
	}

	const endBlock = getClosestBlock(range.endContainer, editor);
	if (!endBlock?.dataset.blockId) return null;

	const endOffset = getOffsetInBlock(
		endBlock,
		range.endContainer,
		range.endOffset,
	);

	return {
		blockId: startBlock.dataset.blockId,
		offset,
		isRange: true,
		endBlockId: endBlock.dataset.blockId,
		endOffset,
	};
};

export function captureEditorState(editor: HTMLElement): HistoryState {
	const blocks = Array.from(editor.children)
		.filter(isHTMLElement)
		.map((block) => ({
			blockId: block.dataset.blockId || uniqueId("block"),
			html: block.outerHTML,
		}));

	const selection = blocks.length > 0 ? captureSelection(editor) : null;

	return { blocks, selection };
}

export function captureChangedBlocks(
	editor: HTMLElement,
	previousState: HistoryState,
): BlockSnapshot[] {
	const currentBlocks = Array.from(editor.children)
		.filter(isHTMLElement)
		.map((block) => ({
			blockId: block.dataset.blockId || uniqueId("block"),
			html: block.outerHTML,
		}));

	const previousBlockMap = new Map(
		previousState?.blocks.map((b) => [b.blockId, b.html]),
	);

	// Only include blocks that changed or are new
	return currentBlocks.filter((block) => {
		const previousHtml = previousBlockMap.get(block.blockId);
		return previousHtml !== block.html;
	});
}
