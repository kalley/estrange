// history.ts

import { uniqueId } from "../core/utils";

// Types
export type HistoryEntryType =
	| "typing" // General text editing
	| "delete" // Backspace/Delete
	| "split" // Enter key
	| "merge" // Backspace at block start
	| "format"; // Inline formatting (if you add toolbar later)

export type SelectionState = {
	blockId: string;
	offset: number;
	isRange: boolean;
	endBlockId?: string;
	endOffset?: number;
};

export type BlockSnapshot = {
	blockId: string;
	html: string;
};

export type HistoryEntry = {
	id: string;
	type: HistoryEntryType;
	before: {
		blocks: BlockSnapshot[];
		selection: SelectionState | null;
		deletedBlockIds?: string[];
	};
	after: {
		blocks: BlockSnapshot[];
		selection: SelectionState | null;
		deletedBlockIds?: string[];
	};
	previousId: string | null;
	nextId: string | null;
	timestamp: number;
};

export type HistoryEntryData = Omit<
	HistoryEntry,
	"id" | "previousId" | "nextId" | "timestamp"
>;

export type HistoryState = {
	blocks: BlockSnapshot[];
	selection: SelectionState | null;
	deletedBlockIds?: string[];
};

export type HistoryMetrics = {
	stackSize: number;
	currentEntryId: string | null;
	headId: string | null;
	tailId: string | null;
	canUndo: boolean;
	canRedo: boolean;
};

type HistoryManagerOptions = {
	maxSize?: number;
	onMetricsChange?: (metrics: HistoryMetrics) => void;
};

export function createHistoryManager(options: HistoryManagerOptions = {}) {
	const { maxSize = 0, onMetricsChange } = options;

	// State
	const entries = new Map<string, HistoryEntry>();
	let currentEntryId: string | null = null;
	let headId: string | null = null; // Oldest entry
	let tailId: string | null = null; // Newest entry
	let isRestoring = false;

	// Helper: Get current entry
	function getCurrentEntry(): HistoryEntry | null {
		if (!currentEntryId) return null;
		return entries.get(currentEntryId) ?? null;
	}

	// Helper: Emit metrics
	function emitMetrics(): void {
		if (!onMetricsChange) return;

		onMetricsChange(getMetrics());
	}

	// Helper: Remove oldest entry when exceeding maxSize
	function enforceMaxSize(): void {
		if (maxSize <= 0) return; // Unlimited

		while (entries.size > maxSize && headId) {
			const oldHead = entries.get(headId);
			if (!oldHead) break;

			const newHeadId = oldHead.nextId;
			entries.delete(headId);

			if (newHeadId) {
				const newHead = entries.get(newHeadId);
				if (newHead) {
					newHead.previousId = null;
				}
				headId = newHeadId;
			} else {
				// We deleted the only entry
				headId = null;
				tailId = null;
			}
		}
	}

	// Helper: Truncate redo stack
	function truncateRedoStack(): void {
		const current = getCurrentEntry();
		if (!current || !current.nextId) return;

		// Remove all entries after current
		let entryIdToRemove: string | null = current.nextId;
		while (entryIdToRemove) {
			const entryToRemove = entries.get(entryIdToRemove);
			if (!entryToRemove) break;

			const nextId = entryToRemove.nextId;
			entries.delete(entryIdToRemove);
			entryIdToRemove = nextId;
		}

		// Update current entry's nextId and tailId
		current.nextId = null;
		tailId = current.id;
	}

	// Public API
	function push(entryData: HistoryEntryData): void {
		// Truncate redo stack if we're not at the tail
		if (currentEntryId) {
			truncateRedoStack();
		}

		// Create new entry
		const newEntry: HistoryEntry = {
			...entryData,
			id: uniqueId("ligature-history"),
			previousId: currentEntryId,
			nextId: null,
			timestamp: Date.now(),
		};

		// Add to map
		entries.set(newEntry.id, newEntry);

		// Update links
		if (currentEntryId) {
			const current = entries.get(currentEntryId);
			if (current) {
				current.nextId = newEntry.id;
			}
		}

		// Update head/tail
		if (!headId) {
			headId = newEntry.id;
		}
		tailId = newEntry.id;

		// Update current
		currentEntryId = newEntry.id;

		// Enforce size limit
		enforceMaxSize();

		// Emit metrics
		emitMetrics();
	}

	function undo() {
		isRestoring = true;

		try {
			const current = getCurrentEntry();

			if (!current) return null;

			// Move to previous entry
			currentEntryId = current.previousId;

			// Emit metrics
			emitMetrics();

			// Return the "before" state of the current entry
			return {
				blocks: current.before.blocks,
				selection: current.before.selection,
			};
		} finally {
			// Don't reset immediately - let caller finish restoring
			queueMicrotask(() => {
				isRestoring = false;
			});
		}
	}

	function redo() {
		isRestoring = true;

		try {
			const current = getCurrentEntry();

			// If we're at null, we need to go to the head
			if (!current) {
				if (!headId) return null;
				currentEntryId = headId;
				const head = entries.get(headId);
				if (!head) return null;

				emitMetrics();
				return {
					blocks: head.after.blocks,
					selection: head.after.selection,
				};
			}

			// Otherwise, move to next entry
			if (!current.nextId) return null;

			currentEntryId = current.nextId;
			const next = entries.get(current.nextId);
			if (!next) return null;

			emitMetrics();
			return {
				blocks: next.after.blocks,
				selection: next.after.selection,
			};
		} finally {
			queueMicrotask(() => {
				isRestoring = false;
			});
		}
	}

	function canUndo(): boolean {
		return currentEntryId !== null;
	}

	function canRedo(): boolean {
		const current = getCurrentEntry();

		// If we're at null, we can redo if there's a head
		if (!current) {
			return headId !== null;
		}

		// Otherwise, we can redo if there's a next entry
		return current.nextId !== null;
	}

	function getMetrics(): HistoryMetrics {
		return {
			stackSize: entries.size,
			currentEntryId,
			headId,
			tailId,
			canUndo: canUndo(),
			canRedo: canRedo(),
		};
	}

	return {
		push,
		undo,
		redo,
		canUndo,
		canRedo,
		getMetrics,
		get isRestoring() {
			return isRestoring;
		},
	};
}
