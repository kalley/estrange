import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const app = style({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
});

export const header = style({
	alignItems: "center",
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.sm,
});

export const heading = style({
	alignItems: "center",
	color: themeVars.color.text,
	display: "flex",
	fontFamily: '"Space Grotesk", sans-serif',
	fontSize: baseVars.font.size.xxxl,
	fontWeight: baseVars.font.weight.regular,
	gap: baseVars.spacing.sm,
	justifyContent: "center",
	paddingTop: baseVars.spacing.lg,
});

export const logo = style({
	width: 48,
});

export const subtitle = style({
	fontFamily: '"Caveat", cursive',
	fontSize: baseVars.font.size.xl,
	fontWeight: baseVars.font.weight.regular,
});

export const content = style({
	flex: 1,
	padding: baseVars.spacing.md,
	paddingBottom: 60,
});
