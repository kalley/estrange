import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const entry = style({
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.sm,
});

export const button = style({
	background: "none",
	border: 0,
	color: themeVars.color.text,
	cursor: "pointer",
	fontFamily: baseVars.font.family.base,
	fontStyle: "italic",
	fontSize: baseVars.font.size.md,
	textAlign: "left",
	"::after": {
		content: "...",
	},
});
