const INLINE_TAGS = ["STRONG", "EM", "CODE"];

export function isKnownInlineElement(el: HTMLElement) {
	return INLINE_TAGS.includes(el.tagName);
}
