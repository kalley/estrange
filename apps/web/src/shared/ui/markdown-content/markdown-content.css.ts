import { style } from "@vanilla-extract/css";
import { themeVars } from "@/shared/styles";

export const editor = style({
	textAlign: "left",
	selectors: {
		"&:empty::before": {
			content: "attr(data-placeholder)",
			color: themeVars.color.textMuted,
			pointerEvents: "none",
			whiteSpace: "pre-wrap",
		},
	},
});
