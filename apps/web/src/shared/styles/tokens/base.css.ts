import { createGlobalTheme } from "@vanilla-extract/css";
import { breakpoints } from "./breakpoints";

export const baseVars = createGlobalTheme(":root", {
	font: {
		family: {
			base: '"Inter", system-ui, sans-serif',
			mono: "monospace",
		},
		size: {
			xs: "0.75rem", // 12px
			sm: "0.875rem", // 14px
			md: "1rem", // 16px
			lg: "1.125rem", // 18px
			xl: "1.25rem", // 20px
			xxl: "1.5rem", // 24px
			xxxl: "2rem", // 32px
		},
		weight: {
			regular: "300",
			medium: "500",
			bold: "600",
		},
		lineHeight: {
			normal: "1.5",
			snug: "1.35",
			tight: "1.15",
		},
		letterSpacing: {
			normal: "0",
			wide: "0.05em",
			wider: "0.1em",
		},
	},
	spacing: {
		none: "0",
		xs: "0.25rem", // 4px
		sm: "0.5rem", // 8px
		md: "1rem", // 16px
		lg: "1.5rem", // 24px
		xl: "2rem", // 32px
		xxl: "3rem", // 48px
	},
	radius: {
		none: "0",
		sm: "2px",
		md: "4px",
		lg: "8px",
		pill: "9999px",
	},
	transition: {
		properties: {
			color: "color 200ms ease",
			background: "background-color 200ms ease",
			// transform: "transform 300ms cubic-bezier(...)",
		},
		durations: {
			fast: "100ms",
			normal: "200ms",
			slow: "400ms",
		},
		timingFunctions: {
			ease: "ease",
			sharp: "cubic-bezier(0.4, 0.0, 0.6, 1)",
		},
	},
	z: {
		base: "0",
		dropdown: "10",
		overlay: "20",
		modal: "30",
		toast: "40",
	},
	breakpoints,
});
