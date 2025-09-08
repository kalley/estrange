import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const navButton = style({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	fontSize: baseVars.font.size.sm,
	color: themeVars.color.textMuted,
	padding: "8px 12px",
	borderRadius: baseVars.radius.md,
	textDecoration: "none",
	transition: baseVars.transition.properties.color,
	cursor: "pointer",

	":hover": {
		color: themeVars.color.text,
	},
});

export const navButtonActive = style({
	color: themeVars.color.primary,
});
