import { assignVars, globalStyle } from "@vanilla-extract/css";
import { baseVars } from "./base.css";
import { themeVars } from "./contract.css";
import { darkTheme } from "./dark.css";
import { lightTheme } from "./light.css";

export { themeVars };

// Default global box model & resets
globalStyle("*, *::before, *::after", {
	boxSizing: "border-box",
	margin: 0,
	padding: 0,
});

globalStyle(":root", {
	vars: assignVars(themeVars, lightTheme),
	"@media": {
		"(prefers-color-scheme: dark)": {
			vars: assignVars(themeVars, darkTheme),
		},
	},
});

globalStyle("body", {
	fontFamily: baseVars.font.family.base,
	backgroundColor: themeVars.color.background,
	color: themeVars.color.text,
	lineHeight: baseVars.font.lineHeight.normal,
	transition: "background-color 0.2s ease, color 0.2s ease",
	margin: 0,
});

globalStyle("#root", {
	height: "100dvh",
});

globalStyle("h1, h2, h3, h4, h5, h6", {
	fontWeight: baseVars.font.weight.bold,
	textAlign: "left",
});

globalStyle("h1", {
	fontSize: baseVars.font.size.xl,
});

globalStyle("h2", {
	fontSize: baseVars.font.size.lg,
});

globalStyle("h3", {
	fontSize: baseVars.font.size.md,
});

globalStyle("svg", {
	display: "block",
});

globalStyle(".markdown-content ol, .markdown-content ul", {
	margin: 0,
	padding: 0,
	marginLeft: baseVars.spacing.lg,
	marginBottom: baseVars.spacing.md,
});

globalStyle(".markdown-content p", {
	marginBottom: baseVars.spacing.md,
});

globalStyle("@counter-style estrange-steps", {
	// @ts-expect-error vanilla extract doesn't directly support counter styles
	system: "fixed",
	symbols: "① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨",
	suffix: "' '",
});
