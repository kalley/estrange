import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const card = style({
	borderRadius: baseVars.radius.lg,
	border: `1px solid ${themeVars.color.primary}`,
	background: themeVars.color.surface,
	padding: baseVars.spacing.md,
	width: "100%",
});
