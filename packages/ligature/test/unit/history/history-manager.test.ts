import {
	type BlockSnapshot,
	createHistoryManager,
	type HistoryEntryType,
	type SelectionState,
} from "../../../src/history";

// Test Helpers
function createMockBlock(id: string, html: string): BlockSnapshot {
	return { blockId: id, html };
}

function createMockSelection(
	blockId: string,
	offset: number,
	isRange = false,
	endBlockId?: string,
	endOffset?: number,
): SelectionState {
	return { blockId, offset, isRange, endBlockId, endOffset };
}

function createMockEntryData(
	type: HistoryEntryType,
	beforeBlocks: BlockSnapshot[],
	beforeSelection: SelectionState,
	afterBlocks: BlockSnapshot[],
	afterSelection: SelectionState,
) {
	return {
		type,
		before: { blocks: beforeBlocks, selection: beforeSelection },
		after: { blocks: afterBlocks, selection: afterSelection },
	};
}

describe("createHistoryManager", () => {
	describe("basic operations", () => {
		it("starts with no undo/redo available", () => {
			const history = createHistoryManager({});

			expect(history.canUndo()).toBe(false);
			expect(history.canRedo()).toBe(false);
		});

		it("push creates new history entry", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello")],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 12),
			);

			history.push(entryData);

			expect(history.canUndo()).toBe(true);
			expect(history.canRedo()).toBe(false);
		});

		it("can undo after push", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello")],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 12),
			);

			history.push(entryData);
			const undoResult = history.undo();

			expect(undoResult).toEqual({
				blocks: [createMockBlock("block-1", "\u200BHello")],
				selection: createMockSelection("block-1", 6),
			});
			expect(history.canUndo()).toBe(false);
			expect(history.canRedo()).toBe(true);
		});

		it("can redo after undo", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello")],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 12),
			);

			history.push(entryData);
			history.undo();
			const redoResult = history.redo();

			expect(redoResult).toEqual({
				blocks: [createMockBlock("block-1", "\u200BHello World")],
				selection: createMockSelection("block-1", 12),
			});
			expect(history.canUndo()).toBe(true);
			expect(history.canRedo()).toBe(false);
		});

		it("cannot redo without undo", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BHi")],
				createMockSelection("block-1", 3),
			);

			history.push(entryData);
			const redoResult = history.redo();

			expect(redoResult).toBeNull();
		});

		it("undo returns null when nothing to undo", () => {
			const history = createHistoryManager({});
			const undoResult = history.undo();

			expect(undoResult).toBeNull();
		});
	});

	describe("redo stack truncation", () => {
		it("push after undo clears redo stack", () => {
			const history = createHistoryManager({});

			// Push two entries
			const entryData1 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);
			const entryData2 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200BAB")],
				createMockSelection("block-1", 3),
			);

			history.push(entryData1);
			history.push(entryData2);

			// Undo once, then push a new entry
			history.undo();
			expect(history.canRedo()).toBe(true);

			const entryData3 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200BAC")],
				createMockSelection("block-1", 3),
			);
			history.push(entryData3);

			// Redo should no longer be available
			expect(history.canRedo()).toBe(false);

			// Stack size should be 2 (entry1 and entry3)
			const metrics = history.getMetrics();
			expect(metrics.stackSize).toBe(2);
		});

		it("multiple undos then push clears all redo", () => {
			const history = createHistoryManager({});

			// Push three entries
			const entryData1 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);
			const entryData2 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200BAB")],
				createMockSelection("block-1", 3),
			);
			const entryData3 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BAB")],
				createMockSelection("block-1", 3),
				[createMockBlock("block-1", "\u200BABC")],
				createMockSelection("block-1", 4),
			);

			history.push(entryData1);
			history.push(entryData2);
			history.push(entryData3);

			// Undo twice
			history.undo();
			history.undo();
			expect(history.canRedo()).toBe(true);

			// Push new entry
			const entryData4 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200BAD")],
				createMockSelection("block-1", 3),
			);
			history.push(entryData4);

			// Should not be able to redo to entry2 or entry3
			expect(history.canRedo()).toBe(false);

			// Stack should only have 2 entries now
			const metrics = history.getMetrics();
			expect(metrics.stackSize).toBe(2);
		});
	});

	describe("max size enforcement", () => {
		it("respects maxSize limit", () => {
			const history = createHistoryManager({ maxSize: 3 });

			// Push 4 entries
			for (let i = 0; i < 4; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${i}`)],
					createMockSelection("block-1", 2),
					[createMockBlock("block-1", `\u200B${i + 1}`)],
					createMockSelection("block-1", 3),
				);
				history.push(entryData);
			}

			const metrics = history.getMetrics();
			expect(metrics.stackSize).toBe(3);
		});

		it("removes oldest entries when exceeding maxSize", () => {
			const history = createHistoryManager({ maxSize: 2 });

			const entryData1 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);
			const entryData2 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200BAB")],
				createMockSelection("block-1", 3),
			);
			const entryData3 = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BAB")],
				createMockSelection("block-1", 3),
				[createMockBlock("block-1", "\u200BABC")],
				createMockSelection("block-1", 4),
			);

			history.push(entryData1);
			history.push(entryData2);
			history.push(entryData3); // Should remove entry1

			// Should only be able to undo once (to entry2's before state)
			expect(history.canUndo()).toBe(true);
			const undoResult = history.undo(); // Now at entry2's before state
			expect(undoResult?.blocks[0].html).toBe("\u200BAB");
			expect(history.canUndo()).toBe(true);
			history.undo();
			expect(history.canUndo()).toBe(false);
		});

		it("currentEntryId updates correctly when entries removed", () => {
			const history = createHistoryManager({ maxSize: 2 });

			// Push 3 entries
			for (let i = 0; i < 3; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${i}`)],
					createMockSelection("block-1", 2),
					[createMockBlock("block-1", `\u200B${i + 1}`)],
					createMockSelection("block-1", 3),
				);
				history.push(entryData);
			}

			const metrics = history.getMetrics();
			// Should still be able to undo even though oldest entry was removed
			expect(metrics.canUndo).toBe(true);
			expect(metrics.stackSize).toBe(2);
			expect(metrics.currentEntryId).not.toBeNull();
		});
	});

	describe("state restoration", () => {
		it("undo restores previous block state", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello")],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 12),
			);

			history.push(entryData);
			const result = history.undo();

			expect(result?.blocks).toEqual([
				createMockBlock("block-1", "\u200BHello"),
			]);
		});

		it("undo restores previous selection", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello")],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 12),
			);

			history.push(entryData);
			const result = history.undo();

			expect(result?.selection).toEqual(createMockSelection("block-1", 6));
		});

		it("undo handles multi-block changes", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"multi-block",
				[
					createMockBlock("block-1", "\u200BFirst"),
					createMockBlock("block-2", "\u200BSecond"),
				],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BFirst Second")],
				createMockSelection("block-1", 13),
			);

			history.push(entryData);
			const result = history.undo();

			expect(result?.blocks).toHaveLength(2);
			expect(result?.blocks[0]).toEqual(
				createMockBlock("block-1", "\u200BFirst"),
			);
			expect(result?.blocks[1]).toEqual(
				createMockBlock("block-2", "\u200BSecond"),
			);
		});

		it("redo restores forward state", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello")],
				createMockSelection("block-1", 6),
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 12),
			);

			history.push(entryData);
			history.undo();
			const result = history.redo();

			expect(result?.blocks).toEqual([
				createMockBlock("block-1", "\u200BHello World"),
			]);
			expect(result?.selection).toEqual(createMockSelection("block-1", 12));
		});

		it("handles range selections", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200BHello World")],
				createMockSelection("block-1", 1, true, "block-1", 6),
				[createMockBlock("block-1", "\u200BWorld")],
				createMockSelection("block-1", 1),
			);

			history.push(entryData);
			const result = history.undo();

			expect(result?.selection).toEqual(
				createMockSelection("block-1", 1, true, "block-1", 6),
			);
		});

		it("handles cross-block range selections", () => {
			const history = createHistoryManager({});
			const entryData = createMockEntryData(
				"multi-block",
				[
					createMockBlock("block-1", "\u200BFirst paragraph"),
					createMockBlock("block-2", "\u200BSecond paragraph"),
				],
				createMockSelection("block-1", 7, true, "block-2", 7),
				[createMockBlock("block-1", "\u200BFirst paragraph")],
				createMockSelection("block-1", 7),
			);

			history.push(entryData);
			const result = history.undo();

			expect(result?.blocks).toHaveLength(2);
			expect(result?.selection.isRange).toBe(true);
			expect(result?.selection.endBlockId).toBe("block-2");
		});
	});

	describe("metrics", () => {
		it("getMetrics returns current stack info", () => {
			const history = createHistoryManager({});

			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);

			history.push(entryData);
			const metrics = history.getMetrics();

			expect(metrics.stackSize).toBe(1);
			expect(metrics.currentEntryId).not.toBeNull();
			expect(metrics.canUndo).toBe(true);
			expect(metrics.canRedo).toBe(false);
		});

		it("onMetricsChange fires on push", () => {
			const onMetricsChange = vi.fn();
			const history = createHistoryManager({ onMetricsChange });

			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);

			history.push(entryData);

			expect(onMetricsChange).toHaveBeenCalledWith(
				expect.objectContaining({
					stackSize: 1,
					canUndo: true,
					canRedo: false,
				}),
			);
			// Check that currentEntryId is a string (not null)
			expect(onMetricsChange.mock.calls[0][0].currentEntryId).toEqual(
				expect.any(String),
			);
		});

		it("onMetricsChange fires on undo", () => {
			const onMetricsChange = vi.fn();
			const history = createHistoryManager({ onMetricsChange });

			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);

			history.push(entryData);
			onMetricsChange.mockClear();

			history.undo();

			expect(onMetricsChange).toHaveBeenCalledWith(
				expect.objectContaining({
					stackSize: 1,
					canUndo: false,
					canRedo: true,
				}),
			);
		});

		it("onMetricsChange fires on redo", () => {
			const onMetricsChange = vi.fn();
			const history = createHistoryManager({ onMetricsChange });

			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B")],
				createMockSelection("block-1", 1),
				[createMockBlock("block-1", "\u200BA")],
				createMockSelection("block-1", 2),
			);

			history.push(entryData);
			history.undo();
			onMetricsChange.mockClear();

			history.redo();

			expect(onMetricsChange).toHaveBeenCalledWith(
				expect.objectContaining({
					stackSize: 1,
					canUndo: true,
					canRedo: false,
				}),
			);
		});

		it("metrics reflect correct state after truncation", () => {
			const history = createHistoryManager({});

			// Push 3 entries
			for (let i = 0; i < 3; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${i}`)],
					createMockSelection("block-1", 2),
					[createMockBlock("block-1", `\u200B${i + 1}`)],
					createMockSelection("block-1", 3),
				);
				history.push(entryData);
			}

			// Undo twice
			history.undo();
			history.undo();

			// Push new entry (should truncate)
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B1")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200B1X")],
				createMockSelection("block-1", 3),
			);
			history.push(entryData);

			const metrics = history.getMetrics();
			expect(metrics.stackSize).toBe(2); // Only 2 entries remain
			expect(metrics.canRedo).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("handles zero maxSize as unlimited", () => {
			const history = createHistoryManager({ maxSize: 0 });

			// Push many entries
			for (let i = 0; i < 100; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${i}`)],
					createMockSelection("block-1", 2),
					[createMockBlock("block-1", `\u200B${i + 1}`)],
					createMockSelection("block-1", 3),
				);
				history.push(entryData);
			}

			const metrics = history.getMetrics();
			expect(metrics.stackSize).toBe(100);
		});

		it("handles undefined maxSize as unlimited", () => {
			const history = createHistoryManager({});

			// Push many entries
			for (let i = 0; i < 100; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${i}`)],
					createMockSelection("block-1", 2),
					[createMockBlock("block-1", `\u200B${i + 1}`)],
					createMockSelection("block-1", 3),
				);
				history.push(entryData);
			}

			const metrics = history.getMetrics();
			expect(metrics.stackSize).toBe(100);
		});

		it("consecutive undos and redos maintain consistency", () => {
			const history = createHistoryManager({});

			for (let i = 0; i < 5; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${"A".repeat(i)}`)],
					createMockSelection("block-1", i + 1),
					[createMockBlock("block-1", `\u200B${"A".repeat(i + 1)}`)],
					createMockSelection("block-1", i + 2),
				);
				history.push(entryData);
			}

			// Undo all
			for (let i = 0; i < 5; i++) {
				history.undo();
			}

			expect(history.canUndo()).toBe(false);
			expect(history.canRedo()).toBe(true);

			// Redo all
			for (let i = 0; i < 5; i++) {
				history.redo();
			}

			expect(history.canUndo()).toBe(true);
			expect(history.canRedo()).toBe(false);
		});

		it("entry linkage maintains integrity after operations", () => {
			const history = createHistoryManager({});

			// Push 3 entries
			for (let i = 0; i < 3; i++) {
				const entryData = createMockEntryData(
					"typing",
					[createMockBlock("block-1", `\u200B${i}`)],
					createMockSelection("block-1", 2),
					[createMockBlock("block-1", `\u200B${i + 1}`)],
					createMockSelection("block-1", 3),
				);
				history.push(entryData);
			}

			// Undo, push, undo, redo - complex navigation
			history.undo();
			const entryData = createMockEntryData(
				"typing",
				[createMockBlock("block-1", "\u200B2")],
				createMockSelection("block-1", 2),
				[createMockBlock("block-1", "\u200B2X")],
				createMockSelection("block-1", 3),
			);
			history.push(entryData);

			// Should still be able to undo/redo consistently
			const undo1 = history.undo();
			expect(undo1?.blocks[0].html).toBe("\u200B2");

			const redo1 = history.redo();
			expect(redo1?.blocks[0].html).toBe("\u200B2X");
		});
	});
});
