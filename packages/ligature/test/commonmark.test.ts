/// <reference path="./@types/commonmark-spec.d.ts" />
import { type Test, tests } from "commonmark-spec";
import { renderMarkdown } from "../src/core/renderer";

describe("Ligature parsing", () => {
	const passing = [
		10, 11, 29, 30, 35, 42, 43, 44, 45, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58,
		60, 62, 63, 64, 67, 68, 71, 72, 73, 74, 75, 77, 78, 94, 97, 98, 99, 197,
		199, 219, 221, 227, 255, 261, 265, 267, 268, 269, 275, 276, 282, 295, 297,
		303, 305, 310, 322, 327, 328, 332, 338, 341, 342, 345, 348, 350, 351, 355,
		356, 357, 358, 360, 361, 364, 365, 366, 370, 371, 374, 376, 377, 378, 379,
		381, 382, 383, 386, 387, 390, 391, 393, 396, 397, 399, 400, 402, 403, 406,
		410, 411, 412, 420, 421, 424, 428, 429, 434, 435, 436, 438, 439, 441, 446,
		448, 450, 451, 453, 458, 460, 461, 462, 463, 469, 478, 479, 497, 488, 511,
		513, 523, 525, 546, 547, 548, 551, 602, 607, 608, 609, 610, 611, 612, 618,
		622, 644, 645, 646, 647, 650, 651, 652,
	];

	const examples = tests
		.filter(({ number }) => passing.includes(number))
		.map(({ number }) => number);

	Object.values(
		tests
			// .filter(({ html }) => !html.match("<br"))
			.filter(({ number }) => examples.includes(number))
			.reduce<Record<Test["section"], Test[]>>(
				(grouped, test) => {
					const section = test.section;
					grouped[section] = grouped[section] || [];
					grouped[section].push(test);
					return grouped;
				},
				{} as Record<Test["section"], Test[]>,
			),
	).forEach((sectionTests) => {
		describe(sectionTests[0].section, () => {
			it.each(sectionTests)(
				"example $number: $markdown → $html",
				({ markdown, html }) => {
					const fragment = renderMarkdown(markdown.replace(/→/g, "\t"), {
						includeZWS: false,
						preserveStructure: true,
					});
					const div = document.createElement("div");
					div.appendChild(fragment);
					expect(div.innerHTML.replaceAll("<hr>", "<hr />")).toEqual(
						html.replace(/\n/g, ""),
					);
				},
			);
		});
	});
});
