import { normalizeZWS, ZWS } from "../dom/zw-utils";

export type InlineNode =
	| { type: "text"; value: string }
	| { type: "emphasis"; children: InlineNode[] }
	| { type: "strong"; children: InlineNode[] }
	| { type: "strikethrough"; children: InlineNode[] }
	| { type: "code"; value: string };

interface DelimiterInfo {
	marker: string;
	type: InlineNode["type"] | "strongEmphasis";
	priority: number;
	canNest: boolean;
}

interface Span {
	start: number;
	end: number;
	type: InlineNode["type"];
	markerLength: number;
}

interface StackEntry {
	delimiter: DelimiterInfo;
	position: number;
}

const DELIMITERS: DelimiterInfo[] = [
	{ marker: "`", type: "code", priority: 0, canNest: false }, // Highest priority, no nesting
	{ marker: "*", type: "emphasis", priority: 1, canNest: true },
	{ marker: "_", type: "emphasis", priority: 1, canNest: true },
	{ marker: "**", type: "strong", priority: 2, canNest: true },
	{ marker: "__", type: "strong", priority: 2, canNest: true },
	{ marker: "***", type: "strongEmphasis", priority: 3, canNest: true }, // Will create nested strong+em
	{ marker: "___", type: "strongEmphasis", priority: 3, canNest: true },
	{ marker: "~~", type: "strikethrough", priority: 2, canNest: true },
];

export const INLINE_MARKERS = DELIMITERS.map((d) => d.marker);

const SORTED_DELIMITERS = DELIMITERS.sort(
	(a, b) => b.marker.length - a.marker.length,
);

export const parseInlinePatterns = (text: string): InlineNode[] => {
	if (!text.trim()) return [{ type: "text", value: text }];

	// Phase 1: Tokenize
	const tokens = tokenize(text);

	// Phase 2: Match delimiters using stack
	const spans = matchDelimiters(tokens, text);

	// Phase 3: Convert to AST
	return spansToAST(text, spans);
};

function tokenize(
	text: string,
): Array<{ type: "text" | "delimiter"; value: string; position: number }> {
	const tokens = [];
	let i = 0;

	while (i < text.length) {
		let foundDelimiter = null;

		// Check for delimiters (longest first to handle *** before **)
		for (const delim of SORTED_DELIMITERS) {
			const runLength = countDelimiterRun(text, i, delim.marker[0]);
			if (runLength > 3) {
				// Treat as literal text, push as a single text token
				tokens.push({
					type: "text",
					value: text.slice(i, i + runLength),
					position: i,
				} as const);
				i += runLength; // <-- advance past the run
				continue;
			}
			if (text.startsWith(delim.marker, i)) {
				// Validate delimiter context if needed
				if (isValidDelimiter(text, i, delim)) {
					foundDelimiter = delim;
					break;
				}
			}
		}

		if (foundDelimiter) {
			tokens.push({
				type: "delimiter",
				value: foundDelimiter.marker,
				position: i,
			} as const);
			i += foundDelimiter.marker.length;
		} else {
			// Collect text until next potential delimiter
			const textStart = i;
			i++; // Move at least one character
			while (i < text.length && !hasDelimiterAt(text, i)) {
				i++;
			}
			tokens.push({
				type: "text",
				value: text.slice(textStart, i),
				position: textStart,
			} as const);
		}
	}

	return tokens;
}

function countDelimiterRun(text: string, pos: number, char: string) {
	let count = 0;
	while (text[pos] === char) {
		count++;
		pos++;
	}
	return count;
}

function isValidDelimiter(
	text: string,
	pos: number,
	delim: DelimiterInfo,
): boolean {
	if (delim.type === "code") return true;

	const marker = delim.marker;
	const markerLen = marker.length;
	const before = pos > 0 ? text[pos - 1] : "";
	const after = pos + markerLen < text.length ? text[pos + markerLen] : "";

	const isUnderscore = marker.includes("_");
	const isAsterisk = marker.includes("*");

	if (isUnderscore || isAsterisk) {
		const prevChar = before;
		const nextChar = after;

		// Whitespace tests
		const prevIsSpace = prevChar === "" || /\s/.test(prevChar);
		const nextIsSpace = nextChar === "" || /\s/.test(nextChar);

		// Alphanumeric tests (letters or digits)
		const prevIsAlnum = /[a-zA-Z0-9]/.test(prevChar);
		const nextIsAlnum = /[a-zA-Z0-9]/.test(nextChar);

		let canOpen = false;
		let canClose = false;

		if (isAsterisk) {
			// Asterisks: open if next is not space, close if prev is not space
			canOpen = !nextIsSpace;
			canClose = !prevIsSpace;
		}

		if (isUnderscore) {
			// Underscores: stricter
			// Open if next is not space AND prev is not alphanumeric
			canOpen = !nextIsSpace && !prevIsAlnum;
			// Close if prev is not space AND next is not alphanumeric
			canClose = !prevIsSpace && !nextIsAlnum;
		}

		return canOpen || canClose;
	}

	// All other delimiters behave normally
	return true;
}

function hasDelimiterAt(text: string, pos: number): boolean {
	return DELIMITERS.some(
		(delim) =>
			text.startsWith(delim.marker, pos) && isValidDelimiter(text, pos, delim),
	);
}

function matchDelimiters(
	tokens: Array<{
		type: "text" | "delimiter";
		value: string;
		position: number;
	}>,
	text: string,
): Span[] {
	const stack: StackEntry[] = [];
	const spans: Span[] = [];

	for (const token of tokens) {
		if (token.type !== "delimiter") continue;

		const delimInfo = DELIMITERS.find((d) => d.marker === token.value);
		if (!delimInfo) continue;

		// ✅ Special handling: code span
		if (delimInfo.type === "code") {
			const openerIndex = findStackIndex(stack, "code", token.value);

			if (openerIndex !== -1) {
				// Found matching opener -> create code span
				const opener = stack[openerIndex];
				spans.push({
					start: opener.position,
					end: token.position + token.value.length,
					type: "code",
					markerLength: token.value.length,
				});

				// Remove opener and everything after it
				stack.splice(openerIndex);
			} else {
				// Push new code span opener
				stack.push({ delimiter: delimInfo, position: token.position });
			}

			continue;
		}

		// ✅ If we’re inside a code span, skip all other delimiters
		if (stack.some((entry) => entry.delimiter.type === "code")) {
			continue;
		}

		// ✅ Handle triple delimiters separately
		if (delimInfo.type === "strongEmphasis") {
			handleTripleDelimiter(token, stack, spans, text);
			continue;
		}

		// ✅ Normal emphasis/strong/strike handling
		const matchingIndex = findStackIndex(stack, delimInfo.type, token.value);

		if (matchingIndex !== -1) {
			const opener = stack[matchingIndex];
			const content = text.slice(
				opener.position + token.value.length,
				token.position,
			);

			if (content.trim().length > 0) {
				spans.push({
					start: opener.position,
					end: token.position + token.value.length,
					type: delimInfo.type,
					markerLength: token.value.length,
				});
			}

			stack.splice(matchingIndex);
		} else {
			stack.push({ delimiter: delimInfo, position: token.position });
		}
	}

	return spans.sort((a, b) => a.start - b.start);
}

function handleTripleDelimiter(
	token: { value: string; position: number },
	stack: StackEntry[],
	spans: Span[],
	text: string,
) {
	const baseMarker = token.value === "***" ? "*" : "_";
	const doubleMarker = token.value === "***" ? "**" : "__";

	// Look for matching triple delimiter first
	const tripleIndex = stack.findIndex(
		(entry) => entry.delimiter.marker === token.value,
	);

	if (tripleIndex !== -1) {
		const opener = stack[tripleIndex];
		const content = text.slice(opener.position + 3, token.position);

		if (content.trim().length > 0) {
			// Create nested strong > emphasis structure
			spans.push({
				start: opener.position,
				end: token.position + 3,
				type: "strong",
				markerLength: 2, // Outer ** part
			});
			spans.push({
				start: opener.position + 2,
				end: token.position + 1,
				type: "emphasis",
				markerLength: 1, // Inner * part
			});
		}

		stack.splice(tripleIndex);
		return;
	}

	// No triple match - try to match as double + single
	const doubleIndex = findStackIndex(stack, "strong", doubleMarker);

	if (doubleIndex !== -1) {
		const opener = stack[doubleIndex];
		const content = text.slice(opener.position + 2, token.position);

		if (content.trim().length > 0) {
			spans.push({
				start: opener.position,
				end: token.position + 2,
				type: "strong",
				markerLength: 2,
			});
		}

		stack.splice(doubleIndex);

		const delimiter = DELIMITERS.find((d) => d.marker === baseMarker);
		if (delimiter) {
			// Add remaining single marker as potential opener
			stack.push({
				delimiter,
				position: token.position + 2,
			});
		}
		return;
	}

	const delimiter = DELIMITERS.find((d) => d.marker === token.value);

	if (delimiter) {
		// No double match - treat as potential triple opener
		stack.push({
			delimiter,
			position: token.position,
		});
	}
}

function findStackIndex(
	stack: StackEntry[],
	type: InlineNode["type"],
	marker: string,
): number {
	for (let i = stack.length - 1; i >= 0; i--) {
		if (
			stack[i].delimiter.type === type &&
			stack[i].delimiter.marker === marker
		) {
			return i;
		}
	}
	return -1;
}

function spansToAST(text: string, spans: Span[]): InlineNode[] {
	const resolvedSpans = resolveSpanConflicts(spans);
	return buildAST(text, resolvedSpans, 0, text.length);
}

function resolveSpanConflicts(spans: Span[]): Span[] {
	// Sort by start position, then by span length (shorter spans = higher priority)
	const sorted = [...spans].sort((a, b) => {
		if (a.start !== b.start) return a.start - b.start;
		return a.end - a.start - (b.end - b.start);
	});

	const resolved: Span[] = [];

	for (const span of sorted) {
		// Check for conflicts with existing spans
		const hasConflict = resolved.some((existing) => {
			const overlap = span.start < existing.end && span.end > existing.start;
			const properNesting =
				(span.start >= existing.start && span.end <= existing.end) ||
				(existing.start >= span.start && existing.end <= span.end);
			return overlap && !properNesting;
		});

		if (!hasConflict) {
			resolved.push(span);
		}
	}

	return resolved;
}

function buildAST(
	text: string,
	spans: Span[],
	start: number,
	end: number,
): InlineNode[] {
	const nodes: InlineNode[] = [];
	let currentPos = start;

	// Find spans that start in this range, sorted by start position
	const localSpans = spans
		.filter((span) => span.start >= start && span.start < end)
		.sort((a, b) => a.start - b.start);

	for (const span of localSpans) {
		if (span.end <= currentPos) continue;

		// Add text before this span
		if (currentPos < span.start) {
			const textValue = text.slice(currentPos, span.start);
			nodes.push({ type: "text", value: textValue });
		}

		const start = Math.max(span.start, currentPos);
		const innerStart = start + span.markerLength;
		const innerEnd = span.end - span.markerLength;

		if (span.type === "code") {
			const codeContent = text.slice(innerStart, innerEnd);
			nodes.push({ type: "code", value: codeContent });
		} else if (span.type === "text") {
			const textValue = text.slice(innerStart, innerEnd);
			nodes.push({ type: "text", value: textValue.trimStart() });
		} else {
			const children = buildAST(text, spans, innerStart, innerEnd);
			nodes.push({ type: span.type, children });
		}

		currentPos = span.end; // now safe: no nested span can extend past end
	}

	// Add remaining text
	if (currentPos < end) {
		const textValue = text.slice(currentPos, end);
		if (textValue) {
			nodes.push({ type: "text", value: textValue });
		}
	}

	return nodes;
}

export function astToDOM(
	nodes: InlineNode[],
	includeZWS: boolean,
): DocumentFragment {
	const fragment = document.createDocumentFragment();

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];

		if (node.type === "text") {
			if (node.value) {
				const text = includeZWS ? normalizeZWS(node.value) : node.value;
				fragment.appendChild(document.createTextNode(text));
			}
		} else if (node.type === "code") {
			const codeEl = document.createElement("code");
			const text = includeZWS ? normalizeZWS(node.value) : node.value;
			codeEl.appendChild(document.createTextNode(text));
			fragment.appendChild(codeEl);

			// Add ZWS after code for cursor escape
			const nextNode = nodes[i + 1];
			if (
				includeZWS &&
				(!nextNode ||
					(nextNode.type === "text" && !nextNode.value.startsWith(" ")))
			) {
				fragment.appendChild(document.createTextNode(ZWS));
			}
		} else {
			const tagName =
				node.type === "emphasis"
					? "em"
					: node.type === "strong"
						? "strong"
						: "s";
			const element = document.createElement(tagName);

			const childFragment = astToDOM(node.children, includeZWS);
			if (includeZWS && !childFragment.textContent?.startsWith(ZWS)) {
				element.appendChild(document.createTextNode(ZWS));
			}
			element.appendChild(childFragment);
			fragment.appendChild(element);

			// Add ZWS after formatted elements for cursor escape
			const nextNode = nodes[i + 1];
			if (
				includeZWS &&
				(!nextNode ||
					(nextNode.type === "text" && !nextNode.value.startsWith(" ")))
			) {
				fragment.appendChild(document.createTextNode(ZWS));
			}
		}
	}

	return fragment;
}
