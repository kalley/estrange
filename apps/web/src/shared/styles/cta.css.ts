import { keyframes } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { baseVars, themeVars } from "@/shared/styles";

const pulseShadow = keyframes({
	"0%": {
		boxShadow: `0 0 4px 0 ${themeVars.color.primary}`,
	},
	"45%": {
		boxShadow: `0 0 3px 10px ${themeVars.color.primaryForeground}`,
	},
});

export const cta = recipe({
	base: {
		background: themeVars.color.primaryForeground,
		border: `1px solid ${themeVars.color.primary}`,
		borderRadius: baseVars.radius.lg,
		color: themeVars.color.primary,
		cursor: "pointer",
		display: "block",
		fontSize: baseVars.font.size.lg,
		paddingBlock: baseVars.spacing.md,
		paddingInline: baseVars.spacing.sm,
		textAlign: "center",
		textDecoration: "none",
		transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out",
		width: "100%",
		selectors: {
			"&:hover": {
				background: themeVars.color.primaryHover,
				color: themeVars.color.primaryForeground,
			},
			"&:active": {
				background: themeVars.color.primaryHover,
				color: themeVars.color.primaryForeground,
			},
		},
	},
	variants: {
		first: {
			true: {
				animation: `${pulseShadow} 2.5s infinite`,
			},
		},
	},
});
