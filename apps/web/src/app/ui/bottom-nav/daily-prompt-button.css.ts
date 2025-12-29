import { recipe } from "@vanilla-extract/recipes";
import { baseVars, themeVars } from "@/shared/styles";

export const dailyPromptButton = recipe({
	base: {
		backgroundColor: themeVars.color.primary,
		border: 0,
		color: themeVars.color.primaryForeground,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: baseVars.radius.pill,
		marginBlock: `calc(-1 * ${baseVars.spacing.md})`,
		marginInline: `calc(-1 * ${baseVars.spacing.md})`,
		padding: baseVars.spacing.md,
		zIndex: 1001,
	},
});
