import { type Node, parseInlinePatterns } from "../parsers/inline-parser";

export type PatternCache = Map<string, Node[]>;

export const getCachedPatterns = (
	text: string,
	cache: PatternCache,
	maxSize = 1000,
) => {
	if (cache.has(text)) return cache.get(text);

	const patterns = parseInlinePatterns(text);
	cache.set(text, patterns);

	// Simple LRU eviction
	if (cache.size > maxSize) {
		const firstKey = cache.keys().next().value;
		if (firstKey) cache.delete(firstKey);
	}

	return patterns;
};
