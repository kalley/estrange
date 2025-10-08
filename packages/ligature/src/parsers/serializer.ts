import { isHTMLElement, isTextNode } from "../dom/utils";

export const serializeToMarkdown = (root: HTMLElement) => {
	const lines: (string | null)[] = [];

	root.childNodes.forEach((block) => {
		if (isTextNode(block)) {
			if (block.textContent?.trim()) lines.push(inlineNodeToMarkdown(block));
			return;
		}

		if (!isHTMLElement(block)) return;

		if (block.tagName.match(/^H([1-6])$/)) {
			const level = parseInt(block.tagName[1], 10);
			lines.push(`${"#".repeat(level)} ${inlineNodeToMarkdown(block)}`);
			lines.push("");
		} else if (block.tagName === "UL") {
			block.querySelectorAll("li").forEach((li) => {
				lines.push(`- ${inlineNodeToMarkdown(li)}`);
			});
			lines.push("");
		} else if (block.tagName === "OL") {
			let i = parseInt(block.getAttribute("start") || "1", 10);
			block.querySelectorAll("li").forEach((li) => {
				lines.push(`${i}. ${inlineNodeToMarkdown(li)}`);
				i++;
			});
			lines.push("");
		} else if (block.tagName === "LI") {
			lines.push(`- ${inlineNodeToMarkdown(block)}`);
		} else if (block.tagName === "HR") {
			lines.push("----");
			lines.push("");
		} else {
			lines.push(inlineNodeToMarkdown(block));
			lines.push("");
		}
	});
	return lines.filter((node) => node !== null).join("\n");
};

const inlineNodeToMarkdown = (node: Node): string => {
	if (!node) return "";
	if (isTextNode(node)) {
		return (node.nodeValue || "")
			.replace(/[\u200B\n]/g, "")
			.replace(/\u00a0/g, " "); // Strip ZWS
	}
	if (isHTMLElement(node)) {
		const tag = node.tagName.toLowerCase();
		const content = Array.from(node.childNodes)
			.map(inlineNodeToMarkdown)
			.filter((node) => node !== null)
			.join("");
		if (tag === "strong" || tag === "b") return `**${content}**`;
		if (tag === "em" || tag === "i") return `_${content}_`;
		if (tag === "s" || tag === "del") return `~~${content}~~`;
		return content;
	}
	return "";
};
