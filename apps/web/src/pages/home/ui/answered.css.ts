import { style } from "@vanilla-extract/css";
import { themeVars } from "@/shared/styles";

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
	color: themeVars.color.primary,
});
