import { style } from "@vanilla-extract/css";
import { baseVars, breakpoints, themeVars } from "@/shared/styles";

export const app = style({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	position: "relative",
	width: "100%",
	"@media": {
		[`screen and (min-width: ${breakpoints.sm})`]: {
			marginInline: "auto",
			width: "600px",
		},
	},
});

export const header = style({
	alignItems: "center",
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.sm,
	borderBottom: `1px solid ${themeVars.color.border}`,
	paddingBottom: baseVars.spacing.lg,
});

export const heading = style({
	alignItems: "center",
	color: themeVars.color.text,
	display: "flex",
	fontFamily: '"Space Grotesk", sans-serif',
	fontSize: baseVars.font.size.xxxl,
	fontWeight: baseVars.font.weight.regular,
	gap: baseVars.spacing.sm,
	justifyContent: "center",
	paddingTop: baseVars.spacing.lg,
});

export const logo = style({
	width: 48,
});

export const subtitle = style({
	fontFamily: '"Space Grotesk", sans-serif',
	fontSize: baseVars.font.size.lg,
	fontStyle: "italic",
	fontWeight: baseVars.font.weight.regular,
});

export const content = style({
	flex: 1,
	padding: baseVars.spacing.md,
	paddingBottom: 62,
});
