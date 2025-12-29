import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const form = style({
	display: "flex",
	flexDirection: "column",
	flex: 1,
	overflow: "auto",
	paddingBottom: `calc(${baseVars.spacing.xxl} * 2)`,
});

export const field = style({
	flex: 1,
	padding: baseVars.spacing.lg,
	overflow: "auto",
	paddingBottom: 0,
	textAlign: "center",
	":focus-within": {
		outline: `1px solid ${themeVars.color.ring}`,
	},
});

export const response = style({
	background: themeVars.color.surface,
	border: 0,
	color: themeVars.color.text,
	flex: 1,
	height: "100%",
	overflowY: "auto",
	resize: "none",
	":focus": {
		outline: "none",
	},
});

export const fab = style({
	backgroundColor: themeVars.color.surface,
	// border: `1px solid ${themeVars.color.primary}`,
	border: 0,
	color: themeVars.color.primary,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	borderRadius: baseVars.radius.pill,
	marginInline: `calc(-1 * ${baseVars.spacing.md})`,
	padding: baseVars.spacing.xs,
	position: "fixed",
	right: baseVars.spacing.xl,
	bottom: baseVars.spacing.md,
	zIndex: 1001,
});
