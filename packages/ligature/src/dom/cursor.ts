import { getNodeFromPath, getNodePath } from "../core/utils";
import { parseBlockMarkdown } from "../parsers/block-parser";
import {
	astToDOM,
	type Node as InlineNode,
	parseInlinePatterns,
} from "../parsers/inline-parser";
import { isHTMLElement, isTextNode } from "./utils";
import { createTextWalker } from "./walker";
import { ZWS } from "./zw-manager";

export interface SelectionState {
	startPath: number[];
	endPath: number[];
	startOffset: number;
	endOffset: number;
	startText: string;
	endText: string;
	startParentTag: string;
	endParentTag: string;
	isCollapsed: boolean;
	surroundingText: { before: string; after: string } | null;
}

// Better cursor management utilities
export const createCursorManager = () => {
	// More robust selection capture that works with DOM mutations
	const captureSelectionState = (
		editor: HTMLElement,
	): SelectionState | null => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return null;

		const range = selection.getRangeAt(0);
		const startContainer = range.startContainer;
		const endContainer = range.endContainer;

		// Instead of just paths, capture more context
		return {
			// Traditional paths as fallback
			startPath: getNodePath(startContainer, editor),
			startOffset: range.startOffset,
			endPath: getNodePath(endContainer, editor),
			endOffset: range.endOffset,

			// Additional context for more robust restoration
			startText: isTextNode(startContainer)
				? (startContainer.textContent ?? "")
				: "",
			endText: isTextNode(endContainer) ? (endContainer.textContent ?? "") : "",
			startParentTag: startContainer.parentElement?.tagName ?? "",
			endParentTag: endContainer.parentElement?.tagName ?? "",

			// For collapsed selections, store surrounding text context
			isCollapsed: range.collapsed,
			surroundingText: range.collapsed ? getSurroundingText(range, 20) : null,
		};
	};

	const getSurroundingText = (range: Range, contextLength = 20) => {
		if (!range.collapsed) return null;

		const container = range.startContainer;
		if (container.nodeType !== Node.TEXT_NODE) return null;

		const text = container.textContent || "";
		const offset = range.startOffset;

		return {
			before: text.slice(Math.max(0, offset - contextLength), offset),
			after: text.slice(offset, offset + contextLength),
		};
	};

	// Smart selection restoration that tries multiple strategies
	const restoreSelectionState = (
		editor: HTMLElement,
		selectionState: SelectionState | null,
	) => {
		if (!selectionState) return false;

		// Strategy 1: Try exact path restoration first
		try {
			const startNode = getNodeFromPath(selectionState.startPath, editor);
			const endNode = getNodeFromPath(selectionState.endPath, editor);

			if (startNode && endNode) {
				const range = document.createRange();
				range.setStart(
					startNode,
					Math.min(
						selectionState.startOffset,
						startNode.textContent?.length || 0,
					),
				);
				range.setEnd(
					endNode,
					Math.min(selectionState.endOffset, endNode.textContent?.length || 0),
				);

				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				return true;
			}
		} catch (_e) {
			// Path restoration failed, try other strategies
		}

		// Strategy 2: Find by text content and parent context
		if (selectionState.isCollapsed && selectionState.surroundingText) {
			const restored = restoreByTextContext(editor, selectionState);
			if (restored) return true;
		}

		// Strategy 3: Find similar elements by tag and approximate position
		if (selectionState.startParentTag) {
			const restored = restoreByElementContext(editor, selectionState);
			if (restored) return true;
		}

		// Fallback: Focus the editor
		editor.focus();
		return false;
	};

	const restoreByTextContext = (
		editor: HTMLElement,
		selectionState: SelectionState,
	) => {
		const { before = "", after = "" } = selectionState.surroundingText ?? {};
		const searchText = before + after;

		// Find text nodes containing our context
		const walker = createTextWalker(editor);

		let node = walker.nextNode();
		while (node) {
			const text = node.textContent || "";
			const contextIndex = text.indexOf(searchText);

			if (contextIndex !== -1) {
				try {
					const range = document.createRange();
					const offset = contextIndex + before.length;
					range.setStart(node, offset);
					range.collapse(true);

					const sel = window.getSelection();
					sel?.removeAllRanges();
					sel?.addRange(range);
					return true;
				} catch (_e) {}
			}
			node = walker.nextNode();
		}
		return false;
	};

	const restoreByElementContext = (
		editor: HTMLElement,
		selectionState: SelectionState,
	) => {
		const elements = editor.querySelectorAll(
			selectionState.startParentTag.toLowerCase(),
		);

		// Try to find element with similar content
		for (const element of elements) {
			if (
				element.textContent?.includes(selectionState.startText.slice(0, 10))
			) {
				try {
					const range = document.createRange();
					const firstTextNode = getFirstTextNode(element);
					if (firstTextNode) {
						range.setStart(firstTextNode, 0);
						range.collapse(true);

						const sel = window.getSelection();
						sel?.removeAllRanges();
						sel?.addRange(range);
						return true;
					}
				} catch (_e) {}
			}
		}
		return false;
	};

	const getFirstTextNode = (element: Node) => {
		const walker = createTextWalker(
			element,
			(node) => !!node.textContent?.trim(),
		);
		return walker.nextNode();
	};

	const captureIfInsideNode = (
		node: Node,
	): {
		textNode: Text;
		offset: number;
		textContent: string;
		parentTag: string;
	} | null => {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return null;

		const range = selection.getRangeAt(0);

		if (range.startContainer === node && isTextNode(node)) {
			return {
				textNode: node as Text,
				offset: range.startOffset,
				// Store more context for better restoration
				textContent: node.textContent || "",
				parentTag: node.parentElement?.tagName || "",
			};
		}

		// Also handle if selection is inside a descendant of this node
		if (node.contains(range.startContainer)) {
			const container = range.startContainer;

			if (isTextNode(container)) {
				return {
					textNode: container,
					offset: range.startOffset,
					textContent: container.textContent || "",
					parentTag: container.parentElement?.tagName || "",
				};
			}
		}

		return null;
	};

	/**
	 * Restore the selection into the given text node + offset.
	 * Collapsed by design.
	 */
	const restoreToNode = (textNode: Text, offset: number) => {
		try {
			// Ensure we have a valid text node
			if (!isTextNode(textNode)) return;
			// Ensure the text node is still in the document
			if (!document.contains(textNode)) return;

			const range = document.createRange();
			const maxOffset = textNode.textContent?.length || 0;
			const safeOffset = Math.min(Math.max(0, offset), maxOffset);

			if (safeOffset < 0 || safeOffset > maxOffset) return;

			range.setStart(textNode, safeOffset);
			range.collapse(true);

			const sel = window.getSelection();
			sel?.removeAllRanges();
			sel?.addRange(range);
		} catch (_e) {
			// Fallback: try to focus the parent element
			let parent = textNode.parentElement;
			while (parent && !parent.focus) {
				parent = parent.parentElement;
			}
			if (parent?.focus) {
				parent.focus();
			}
		}
	};

	return {
		captureSelectionState,
		restoreSelectionState,
		captureIfInsideNode,
		restoreToNode,
	};
};

export type CursorManager = ReturnType<typeof createCursorManager>;

// Enhanced block processing that preserves cursor position
export const processBlock = (
	block: Node,
	isRoot: boolean,
	cursorManager: CursorManager,
) => {
	if (!isHTMLElement(block)) return;

	if (block.tagName === "UL" || block.tagName === "OL") {
		[...block.querySelectorAll("li")].forEach((li) => {
			applyInlineFormatting(li, cursorManager);
		});
		return;
	}

	if (
		block.tagName === "DIV" ||
		block.tagName.match(/^H[1-6]$/) ||
		block.tagName === "LI" ||
		isRoot
	) {
		const text = block.textContent || "";

		if (block.tagName === "DIV" || isRoot) {
			const parsed = parseBlockMarkdown(text);
			console.log({ text, parsed });
			if (parsed) {
				// Capture selection, try incremental first
				const selection = window.getSelection();
				const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
				const cursor = range?.startContainer
					? cursorManager.captureIfInsideNode(range.startContainer)
					: null;

				let newElement!: HTMLElement;
				if (parsed.type === "heading") {
					newElement = document.createElement(`h${parsed.level}`);
					newElement.textContent = parsed.content || ZWS;
				} else if (parsed.type === "ul") {
					newElement = document.createElement("ul");
					const li = document.createElement("li");
					li.textContent = parsed.content || ZWS;
					newElement.appendChild(li);
				} else if (parsed.type === "ol") {
					newElement = document.createElement("ol");
					if (parsed.start && parsed.start > 1) {
						newElement.setAttribute("start", parsed.start.toString());
					}
					const li = document.createElement("li");
					li.textContent = parsed.content || ZWS;
					newElement.appendChild(li);
				}

				if (newElement) {
					if (isRoot) {
						// Special handling for root: replace content, not the element itself
						block.innerHTML = "";
						block.appendChild(newElement);
					} else if (block.parentNode && block.parentNode !== document.body) {
						// Normal case: replace the block element
						block.parentNode.replaceChild(newElement, block);
					}

					const targetElement =
						newElement.tagName === "UL" || newElement.tagName === "OL"
							? newElement.querySelector("li")
							: newElement;
					const textNode = targetElement?.firstChild;

					// Try incremental cursor restore if we had one
					if (cursor && textNode?.nodeType === Node.TEXT_NODE) {
						cursorManager.restoreToNode(textNode as Text, cursor.offset);
					} else {
						// Fall back to full restore if needed
						const state = cursorManager.captureSelectionState(block);
						cursorManager.restoreSelectionState(newElement, state);
					}

					if (targetElement) {
						applyInlineFormatting(targetElement, cursorManager);
					}
					return;
				}
			}
		}

		// Apply inline formatting to any block (including root)
		applyInlineFormatting(block, cursorManager);
	}
};

// Inline formatting that's much more cursor-aware
export const applyInlineFormatting = (
	block: HTMLElement,
	cursorManager: CursorManager,
) => {
	const walker = createTextWalker(block);
	const textNodes: Text[] = [];

	while (walker.nextNode()) {
		if (walker.currentNode.textContent !== ZWS) {
			textNodes.push(walker.currentNode);
		}
	}

	for (const textNode of textNodes) {
		const text = textNode.textContent || "";
		if (!text) continue;

		const cursor = cursorManager.captureIfInsideNode(textNode);
		const ast = parseInlinePatterns(text);
		const needsFormatting =
			ast.length > 1 ||
			ast.some(
				(node) => node.type !== "text", // Multiple nodes means there's formatting
			);

		if (!needsFormatting) continue;

		if (cursor) {
			const parent = textNode.parentNode;
			const originalOffset = cursor.offset;
			if (!parent) continue;

			const originalIndex = [...parent.childNodes].indexOf(textNode);

			const fragment = astToDOM(ast, true);
			parent.replaceChild(fragment, textNode);

			const cursorPosition = findCursorPositionInAST(
				ast,
				originalOffset,
				text,
				originalIndex,
			);

			if (cursorPosition) {
				// Find the actual DOM node that corresponds to our AST position
				const targetNode = findTargetNodeInDOM(parent, cursorPosition);

				if (isTextNode(targetNode?.node)) {
					cursorManager.restoreToNode(targetNode.node, targetNode.offset);
				} else {
					// Fallback: place cursor at the end of the parent
					const lastTextNode = getLastTextNodeIn(parent);
					if (lastTextNode) {
						cursorManager.restoreToNode(
							lastTextNode,
							lastTextNode.textContent?.length || 0,
						);
					}
				}
			} else {
				// No specific position found, place at end
				const lastTextNode = getLastTextNodeIn(parent);
				if (lastTextNode) {
					cursorManager.restoreToNode(
						lastTextNode,
						lastTextNode.textContent?.length || 0,
					);
				}
			}
		} else {
			const fragment = astToDOM(ast, true);
			textNode.parentNode?.replaceChild(fragment, textNode);
		}
	}

	block.normalize();
};

const findCursorPositionInAST = (
	ast: InlineNode[],
	originalOffset: number,
	originalText: string,
	originalIndex: number,
) => {
	let currentOffset = 0;

	for (let nodeIndex = 0; nodeIndex < ast.length; nodeIndex++) {
		const node = ast[nodeIndex];

		if (node.type === "text") {
			const nodeLength = node.value.length;

			if (originalOffset <= currentOffset + nodeLength) {
				return {
					nodeIndex: originalIndex + nodeIndex,
					type: "text",
					offset: originalOffset - currentOffset,
					isInsideFormatting: false,
					originalOffset,
				} as const;
			}
			currentOffset += nodeLength;
		} else {
			// For formatted nodes, we need to check if cursor is inside
			const nodeContent = getNodeTextContent(node);
			const nodeLength = nodeContent.length;

			const wasJustCompleted = checkIfFormattingJustCompleted(
				node,
				originalOffset,
				currentOffset,
				originalText,
			);

			if (wasJustCompleted) {
				// Place cursor AFTER this formatted element
				return {
					nodeIndex: originalIndex + nodeIndex,
					type: "after_formatting",
					formattingType: node.type,
					offset: 0, // Will be placed after the element
					isInsideFormatting: false,
					originalOffset,
				};
			}

			if (originalOffset <= currentOffset + nodeLength) {
				// Cursor is inside this formatted node
				return {
					nodeIndex: originalIndex + nodeIndex,
					type: node.type,
					offset: originalOffset - currentOffset,
					isInsideFormatting: true,
					originalOffset,
				} as const;
			}
			currentOffset += nodeLength;
		}
	}

	// Cursor is at the very end
	return {
		nodeIndex: ast.length - 1,
		type: "end",
		offset: 0,
		isInsideFormatting: false,
		originalOffset,
	} as const;
};

// Helper to get text content from an AST node recursively
const getNodeTextContent = (node: InlineNode): string => {
	if (node.type === "text" || node.type === "code") {
		return node.value;
	}

	if (node.children) {
		return node.children.map(getNodeTextContent).join("");
	}

	return "";
};

// Helper to find the actual DOM node based on our AST position
const findTargetNodeInDOM = (
	parent: ParentNode,
	cursorPosition: {
		nodeIndex: number;
		offset: number;
		type: string;
		isInsideFormatting: boolean;
		originalOffset: number;
	},
) => {
	// Get all the new text nodes in order
	const textNodes: Text[] = [];
	const walker = createTextWalker(parent);

	let node = walker.nextNode();
	while (node) {
		if (isTextNode(node)) {
			textNodes.push(node);
		}
		node = walker.nextNode();
	}

	if (cursorPosition.type === "after_formatting") {
		// Find the formatting element in the DOM corresponding to the AST node
		const formattingNode = parent.childNodes[cursorPosition.nodeIndex];
		if (!formattingNode) return null;

		// Cursor should go into the first text node after this formatting node
		let nextNode = formattingNode.nextSibling;
		while (nextNode && !isTextNode(nextNode)) {
			nextNode = nextNode.nextSibling;
		}

		if (nextNode) {
			nextNode.textContent = `${ZWS}${nextNode.textContent}`;
			return { node: nextNode, offset: 1 };
		}

		// Fallback: end of parent
		const lastTextNode = getLastTextNodeIn(parent);
		return {
			node: lastTextNode,
			offset: lastTextNode?.textContent?.length ?? 0,
		};
	}

	// Handle regular text positioning
	if (cursorPosition.nodeIndex < textNodes.length) {
		const targetNode = textNodes[cursorPosition.nodeIndex];

		return {
			node: targetNode,
			offset: Math.min(
				cursorPosition.offset,
				targetNode.textContent?.length || 0,
			),
		};
	}

	// Fallback to last text node
	if (textNodes.length > 0) {
		const lastNode = textNodes[textNodes.length - 1];
		return {
			node: lastNode,
			offset: lastNode.textContent?.length || 0,
		};
	}

	return null;
};

// Helper to get the last text node in an element
const getLastTextNodeIn = (element: Node) => {
	const walker = createTextWalker(element, (node) => node.textContent !== ZWS);

	let lastNode = null;
	let node = walker.nextNode();
	while (node) {
		lastNode = node;
		node = walker.nextNode();
	}

	return lastNode;
};

const checkIfFormattingJustCompleted = (
	node: InlineNode,
	originalOffset: number, // cursor offset in originalText
	nodeStartOffset: number, // a hint where the node roughly starts
	originalText: string,
): boolean => {
	if (node.type === "text") return false;

	const markers = getMarkersForType(node.type) ?? [];
	if (!markers.length) return false;

	// sort longest-first (*** before ** before *)
	const sortedMarkers = [...markers].sort((a, b) => b.length - a.length);
	const maxMarkerLen = sortedMarkers[0]?.length ?? 0;

	const nodeContent = getNodeTextContent(node);
	if (!nodeContent) return false;

	// search for the nodeContent near the provided start offset.
	// this handles the case where nodeStartOffset might point at the opening marker
	const searchStart = Math.max(0, nodeStartOffset - maxMarkerLen);
	const foundAt = originalText.indexOf(nodeContent, searchStart);
	if (foundAt === -1) return false; // couldn't locate the node content in originalText

	const nodeEndOffset = foundAt + nodeContent.length;

	// Check each marker — only accept if the text immediately after nodeContent
	// is the marker and the cursor (originalOffset) is right after that marker.
	for (const marker of sortedMarkers) {
		const markerLen = marker.length;
		const closingCandidate = originalText.slice(
			nodeEndOffset,
			nodeEndOffset + markerLen,
		);
		if (closingCandidate !== marker) continue;

		const expectedCursorPos = nodeEndOffset + markerLen;
		if (originalOffset === expectedCursorPos) {
			return true;
		}
	}

	return false;
};

const getMarkersForType = (type: string) => {
	switch (type) {
		case "strong":
			return ["**", "__"];
		case "emphasis":
			return ["*", "_"];
		case "strongEmphasis":
			return ["***", "___"];
		case "strikethrough":
			return ["~~"];
		case "code":
			return ["`"];
		default:
			return [];
	}
};
