import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { parse } from "node-html-parser";

interface IconMetadata {
	name: string; // "pensieve"
	componentName: string; // "PensieveIcon"
	title: string; // "Pensieve"
	viewBox: string; // "0 0 512 512"
	paths: string[]; // All <path> elements
}

async function parseSvg(svgPath: string): Promise<IconMetadata> {
	const content = await readFile(svgPath, "utf-8");
	const root = parse(content);
	const svg = root.querySelector("svg");

	if (!svg) throw new Error(`No SVG element in ${svgPath}`);

	const width = svg.getAttribute("width") || "512";
	const height = svg.getAttribute("height") || "512";
	const viewBox = `0 0 ${width} ${height}`;

	// Extract all paths (vtracer might generate multiple)
	const paths = svg
		.querySelectorAll("path")
		.map((p) => p.toString())
		.map((p) => `\t\t\t${p}`); // Indent for template

	const basename = path.parse(svgPath).dir.split("/").at(-1);

	if (!basename) {
		throw new Error("Can't find name");
	}

	const name = basename.replaceAll("_hier", "").replaceAll(/_/g, "-"); // "book_cosmos" → "book-cosmos"

	// Convert to PascalCase: "book-cosmos" → "BookCosmos"
	const componentName = `${name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("")}Icon`;

	// Title: "book-cosmos" → "Book Cosmos"
	const title = name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

	return { name, componentName, title, viewBox, paths };
}

function generateComponent(meta: IconMetadata): string {
	return `import { Svg, type SvgProps } from "./svg";;

export function ${meta.componentName}(props: Omit<SvgProps, "viewBox">) {
\treturn (
\t\t<Svg title="${meta.title}" {...props} viewBox="${meta.viewBox}">
${meta.paths.join("\n")}
\t\t</Svg>
\t);
}
`;
}

async function generateIcons() {
	const svgs = await glob("../liminal-icons-core/svg/**/*.svg");

	for (const svgPath of svgs) {
		const meta = await parseSvg(svgPath);
		const component = generateComponent(meta);

		await writeFile(`src/${meta.name}-icon.tsx`, component, "utf-8");

		console.log(`✓ Generated ${meta.componentName}`);
	}

	// Generate index.ts barrel export
	const allIcons = await glob("./src/*-icon.tsx");
	const exports = allIcons.map((p) => {
		const basename = path.basename(p, ".tsx");
		return `export { ${toPascal(basename)} } from './${basename}';`;
	});

	await writeFile("src/index.ts", exports.join("\n"), "utf-8");
}

function toPascal(kebab: string): string {
	return kebab
		.split("-")
		.map((w) => w[0].toUpperCase() + w.slice(1))
		.join("");
}

generateIcons();
