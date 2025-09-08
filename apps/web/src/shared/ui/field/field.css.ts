import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { baseVars, themeVars } from "@/shared/styles";

export const field = style({
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.sm,
});

export const descriptor = recipe({
	base: {},
	variants: {
		error: {
			true: {
				color: themeVars.color.destructive,
			},
		},
	},
});
