import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const body = style({
	textAlign: "center",
});

export const linkList = style({
	display: "flex",
	flexDirection: "column",
	listStyle: "none",
	gap: "1rem",
});

export const link = style({
	background: 0,
	border: 0,
	color: themeVars.color.primary,
	fontFamily: baseVars.font.family.base,
	fontSize: "1rem",
	lineHeight: baseVars.spacing.lg,
	textDecoration: "underline",
});
