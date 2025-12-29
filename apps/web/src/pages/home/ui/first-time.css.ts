import { style } from "@vanilla-extract/css";
import { baseVars } from "@/shared/styles";

export const header = style({
	alignSelf: "stretch",
});

export const list = style({
	listStyleType: "estrange-steps",
	margin: 0,
	padding: 0,
	marginLeft: baseVars.spacing.md,
});
