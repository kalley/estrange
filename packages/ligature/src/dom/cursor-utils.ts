import { isTextNode } from "./utils";
import { ensureConnected, getDeepLastTextNode } from "./walker";

// ============================================================================
// Core helpers
// ============================================================================

/**
 * Creates a collapsed range from a node + offset.
 */
export const createCollapsedRange = (node: Node, offset: number): Range => {
	const range = document.createRange();
	range.setStart(node, offset);
	range.collapse(true);
	return range;
};

/**
 * Applies a range to a selection, replacing any existing ones.
 */
export const applyRangeToSelection = (
	range: Range,
	selection: Selection | null = window.getSelection(),
): void => {
	if (!selection) return;
	selection.removeAllRanges();
	selection.addRange(range);
};

/**
 * Safely retrieves the active selection range.
 */
export const getSelectionRange = (): Range | null => {
	const selection = window.getSelection();
	return selection?.rangeCount ? selection.getRangeAt(0) : null;
};

// ============================================================================
// Internal utilities
// ============================================================================

/**
 * Sets a collapsed cursor position and applies it, with safety guards.
 */
export const setCursor = (
	node: Node,
	offset: number,
	selection: Selection | null = window.getSelection(),
): boolean => {
	if (!ensureConnected(node) || !selection) return false;

	try {
		const range = createCollapsedRange(node, offset);
		applyRangeToSelection(range, selection);
		return true;
	} catch {
		return false;
	}
};

// ============================================================================
// Cursor movement API
// ============================================================================

export const moveCursorToStart = (
	node: Node,
	selection: Selection | null = window.getSelection(),
): boolean => {
	if (!ensureConnected(node)) return false;

	if (isTextNode(node)) {
		return setCursor(node, 0, selection);
	}

	try {
		const range = document.createRange();
		range.selectNodeContents(node);
		range.collapse(true);
		applyRangeToSelection(range, selection);
		return true;
	} catch {
		return false;
	}
};

export const moveCursorToEnd = (
	node: Node,
	selection: Selection | null = window.getSelection(),
): boolean => {
	if (!ensureConnected(node)) return false;

	const target = getDeepLastTextNode(node);
	if (target?.textContent) {
		return setCursor(target, target.textContent.length, selection);
	}

	// No text node — fallback to end of element
	try {
		const range = document.createRange();
		range.selectNodeContents(node);
		range.collapse(false);
		applyRangeToSelection(range, selection);
		return true;
	} catch {
		return false;
	}
};

export const moveCursorBeforeNode = (
	node: Node,
	selection: Selection | null = window.getSelection(),
): boolean => {
	if (!ensureConnected(node)) return false;

	try {
		const range = document.createRange();
		range.setStartBefore(node);
		range.collapse(true);
		applyRangeToSelection(range, selection);
		return true;
	} catch {
		return false;
	}
};

export const moveCursorAfterNode = (
	node: Node,
	selection: Selection | null = window.getSelection(),
): boolean => {
	if (!ensureConnected(node)) return false;

	try {
		const range = document.createRange();
		range.setStartAfter(node);
		range.collapse(true);
		applyRangeToSelection(range, selection);
		return true;
	} catch {
		return false;
	}
};

// ============================================================================
// Restoration helpers
// ============================================================================

export const restoreCursor = (
	selection: Selection,
	savedContainer: Node,
	savedOffset: number,
	fallback: HTMLElement,
): boolean => {
	let usedFallback = false;
	const range = document.createRange();
	const startNode = savedContainer.isConnected ? savedContainer : fallback;
	const offset = savedContainer.isConnected ? savedOffset : 0;

	try {
		range.setStart(startNode, offset);
	} catch {
		range.setStart(fallback, 0);
		usedFallback = true;
	}

	range.collapse(true);
	applyRangeToSelection(range, selection);

	return !usedFallback;
};
