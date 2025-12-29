import { style } from "@vanilla-extract/css";
import { baseVars } from "@/shared/styles";

export const list = style({
	display: "flex",
	flexDirection: "column",
	gap: baseVars.spacing.md,
	listStyle: "none",
});
