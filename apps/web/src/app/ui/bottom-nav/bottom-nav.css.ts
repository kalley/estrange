import { style } from "@vanilla-extract/css";
import { baseVars, themeVars } from "@/shared/styles";

export const bottomNav = style({
	position: "fixed",
	bottom: 0,
	left: 0,
	right: 0,
	height: "60px", // adjust as needed
	display: "flex",
	justifyContent: "space-around",
	alignItems: "center",
	background: themeVars.color.surface,
	borderTop: `1px solid ${themeVars.color.border}`,
	paddingBottom: "env(safe-area-inset-bottom)", // iOS home indicator
	zIndex: baseVars.z.modal, // above content, below toast/modals
	boxShadow: themeVars.shadow.sm,
});
