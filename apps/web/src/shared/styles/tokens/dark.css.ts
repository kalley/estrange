import * as lch from "./lch-shared.css";

// Lightness
const L_BG_BASE = 10; // near-black background
const L_FG_BASE = 93; // high contrast foreground for elevated elements
const L_SURFACE_BASE = 12; // very dark surface (for cards, etc.)
const L_TEXT_PRIMARY = 95; // main text (on dark bg)
const L_TEXT_SECONDARY = 60; // muted text, less contrast
const L_BORDER_BASE = 30; // mid-dark borders

const L_COLOR_BG = 51.72; // color bg lightness (primary/secondary/destructive)
const L_COLOR_HOVER_BG = 50; // hover color for primary brand color used for buttons, links, highlights.
const L_ON_COLOR = L_BG_BASE; // text/icons on color backgrounds

// Chroma
const C_SURFACE = 3;

export const darkTheme = {
	color: {
		background: `lch(${L_BG_BASE}% 0 0)`, // deep background
		foreground: `lch(${L_FG_BASE}% 0 0)`, // for elevated containers
		surface: `lch(${L_SURFACE_BASE}% ${C_SURFACE} ${lch.H_PRIMARY})`,
		text: `lch(${L_TEXT_PRIMARY}% 0 0)`, // high-contrast white text
		textMuted: `lch(${L_TEXT_SECONDARY}% 0 0)`, // lower-contrast muted text

		border: `lch(${L_BORDER_BASE}% 0 0)`, // subtle separator color

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
			lch(${L_ON_COLOR}% 0 0) 25%,
			lch(20% ${lch.C_PRIMARY} ${lch.H_PRIMARY}) 50%,
			lch(${L_ON_COLOR}% 0 0) 75%,
			lch(${L_ON_COLOR}% 0 0) 100%
		)`,
	},
	shadow: {
		sm: "0 1px 2px lch(0% 0 0 / 0.05)",
		md: "0 4px 6px lch(0% 0 0 / 0.06)",
		lg: "0 10px 15px lch(0% 0 0 / 0.08)",
		focus: `0 0 0 2px lch(${L_COLOR_BG}% ${lch.C_PRIMARY} ${lch.H_PRIMARY} / 0.4)`,
	},
};
