import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { baseVars, themeVars } from "@/shared/styles";

export const dailyPrompt = style({
	background: themeVars.color.surface,
	border: 0,
	borderTop: `1px solid ${themeVars.color.border}`,
	color: themeVars.color.text,
	display: "grid",
	gridTemplateRows: "auto 1fr",
	maxHeight: "100dvh",
	minHeight: "100dvh",
	minWidth: "100vw",
	transform: "translateY(calc(100% - 80px))",
	zIndex: baseVars.z.modal,
	position: "fixed",
	bottom: 0,
	left: 0,
	right: 0,
});

export const content = recipe({
	base: {
		display: "flex",
		flexDirection: "column",
		maxHeight: "100dvh",
		minHeight: "100dvh",
		transition: "transform 0.35s cubic-bezier(0.55, 1.6, 0.6, 0.9)",
	},
	variants: {
		isOpen: {
			true: { transform: "translateY(0)" },
			false: { transform: "translateY(80px)" },
		},
	},
});
