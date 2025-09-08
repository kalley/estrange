import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const container = style({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	padding: baseVars.spacing.lg,
	height: "100%",
	gap: baseVars.spacing.lg,
});

export const hr = style({
	marginBlock: baseVars.spacing.sm,
	padding: 0,
});

export const microcopy = style({
	fontSize: baseVars.font.size.sm,
	color: themeVars.color.textMuted,
	textAlign: "center",
});

export const form = style({
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.lg,
	width: "100%",
});

export const responseArea = style({
	borderRadius: baseVars.radius.lg,
	fontFamily: baseVars.font.family.base,
	fontSize: baseVars.font.size.md,
	minHeight: 240,
	padding: baseVars.spacing.sm,
	width: "100%",

	":focus": {
		boxShadow: themeVars.shadow.focus,
		outlineColor: themeVars.color.ring,
		outlineOffset: themeVars.color.ringOffset,
	},
});

export const field = style({
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.sm,
});
