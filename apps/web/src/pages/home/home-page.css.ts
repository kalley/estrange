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
