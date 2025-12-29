import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const dialog = style({
	background: themeVars.color.surface,
	border: 0,
	color: themeVars.color.text,
	maxHeight: "100dvh",
	minHeight: "100dvh",
	minWidth: "100vw",
});

export const content = style({
	padding: baseVars.spacing.md,
});
