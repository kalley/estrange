import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const header = style({
	alignItems: "center",
	background: themeVars.color.background,
	borderBottom: `1px solid ${themeVars.color.border}`,
	boxShadow: `0 2px 6px ${themeVars.color.border}`,
	color: themeVars.color.textMuted,
	display: "grid",
	gap: baseVars.spacing.md,
	gridTemplateColumns: "1fr",
	gridAutoFlow: "column",
	gridAutoColumns: "auto",
	padding: baseVars.spacing.sm,
	paddingLeft: baseVars.spacing.lg,
	position: "sticky",
});

export const title = style({
	fontSize: baseVars.font.size.md,
});

export const button = style({
	alignSelf: "flex-start",
	background: "none",
	cursor: "pointer",
	display: "block",
	border: 0,
	color: themeVars.color.primary,
});
