import * as lch from "./lch-shared.css";

// Lightness
const L_BG_BASE = 98; // very light background
const L_FG_BASE = 12; // deep foreground for contrast
const L_SURFACE_BASE = 95; // light surface (for cards, etc.)
const L_TEXT_PRIMARY = 12; // nearly black text
const L_TEXT_SECONDARY = 45; // softer gray for muted text
const L_BORDER_BASE = 80; // light gray border

const L_COLOR_BG = 42; // saturated color backgrounds (primary, etc.)
const L_COLOR_HOVER_BG = 30; // saturated color backgrounds (primary, etc.)
const L_ON_COLOR = L_BG_BASE; // text/icons on color bgs (typically white)

// Chroma
const C_SURFACE = 6;

export const lightTheme = {
	color: {
		background: `lch(${L_BG_BASE}% 0 0)`,
		foreground: `lch(${L_FG_BASE}% ${C_SURFACE} ${lch.H_PRIMARY})`,
		surface: `lch(${L_SURFACE_BASE}% ${C_SURFACE} ${lch.H_PRIMARY})`,
		text: `lch(${L_TEXT_PRIMARY}% 0 0)`,
		textMuted: `lch(${L_TEXT_SECONDARY}% 0 0)`,

		border: `lch(${L_BORDER_BASE}% 0 0)`,

		primary: `lch(${L_COLOR_BG}% ${lch.C_PRIMARY} ${lch.H_PRIMARY})`,
		primaryHover: `lch(${L_COLOR_HOVER_BG}% ${lch.C_PRIMARY} ${lch.H_PRIMARY})`,
		primaryForeground: `lch(${L_ON_COLOR}% 0 0)`,

		secondary: `lch(${L_COLOR_BG}% ${lch.C_SECONDARY} ${lch.H_SECONDARY})`,
		secondaryHover: `lch(${L_COLOR_HOVER_BG}% ${lch.C_SECONDARY} ${lch.H_SECONDARY})`,
		secondaryForeground: `lch(${L_ON_COLOR}% 0 0)`,

		destructive: `lch(${L_COLOR_BG}% ${lch.C_DESTRUCTIVE} ${lch.H_DESTRUCTIVE})`,
		destructiveHover: `lch(${L_COLOR_HOVER_BG}% ${lch.C_DESTRUCTIVE} ${lch.H_DESTRUCTIVE})`,
		destructiveForeground: `lch(${L_ON_COLOR}% 0 0)`,

		ring: `lch(${L_COLOR_BG}% ${lch.C_PRIMARY} ${lch.H_PRIMARY} / 0.5)`,
		ringOffset: `lch(${L_SURFACE_BASE}% ${C_SURFACE} ${lch.H_PRIMARY})`,
	},
	gradient: {
		primary: `linear-gradient(
			45deg,
			lch(${L_ON_COLOR}% 0 0) 33%,
			lch(${L_ON_COLOR}% ${lch.C_SECONDARY} ${lch.H_SECONDARY}) 50%,
			lch(${L_ON_COLOR}% 0 0) 66%,
			lch(${L_ON_COLOR}% 0 0) 100%
		)`,
	},
	shadow: {
		sm: "0 1px 2px lch(0% 0 0 / 0.05)",
		md: "0 4px 6px lch(0% 0 0 / 0.08)",
		lg: "0 10px 15px lch(0% 0 0 / 0.1)",
		focus: `0 0 0 2px lch(${L_COLOR_BG}% ${lch.C_PRIMARY} ${lch.H_PRIMARY} / 0.6)`,
	},
};
