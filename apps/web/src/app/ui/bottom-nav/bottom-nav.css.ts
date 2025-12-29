import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";
import { baseVars, themeVars } from "@/shared/styles";

export const bottomNav = style({
	position: "fixed",
	bottom: 0,
	left: 0,
	right: 0,
	zIndex: baseVars.z.modal,
});

export const navBackground = recipe({
	base: {
		position: "absolute",
		inset: 0,
		background: themeVars.color.surface, // or whatever your nav background is
		borderTop: `1px solid ${themeVars.color.border}`, // if you have a border
	},
	variants: { hidden: { true: { display: "none" } } },
});

export const navButtons = style({
	position: "relative",
	display: "flex",
	justifyContent: "space-around",
	alignItems: "center",
	padding: "8px 0",
});

export const fabWrap = style({
	transform: "translateY(-50%)",
});
