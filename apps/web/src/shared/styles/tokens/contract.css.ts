import { createThemeContract } from "@vanilla-extract/css";

export const themeVars = createThemeContract({
	color: {
		/**
		 * The primary background color for app surfaces, e.g. page background.
		 * Should provide a solid foundation with minimal chroma for neutrality.
		 */
		background: null,

		/**
		 * The foreground color used for high-level containers or large UI blocks.
		 * Slightly lighter than background to create subtle layering.
		 */
		foreground: null,

		/**
		 * Surface color used for cards, panels, or elevated surfaces.
		 * Typically a subtle variation from background with low chroma.
		 */
		surface: null,

		/**
		 * Default text color for primary content.
		 * Should have strong contrast against background for readability.
		 */
		text: null,

		/**
		 * Text color for less emphasized or secondary content.
		 * Lower contrast to reduce visual hierarchy.
		 */
		textMuted: null,

		/**
		 * Color used for borders and dividers.
		 * Generally low contrast but distinct enough to separate UI elements.
		 */
		border: null,

		/**
		 * Primary brand color used for buttons, links, highlights.
		 * High saturation and medium lightness to stand out on background.
		 */
		primary: null,

		/**
		 * Hover color for primary brand color used for buttons, links, highlights.
		 * High saturation and medium lightness to stand out on background.
		 */
		primaryHover: null,

		/**
		 * Foreground color (text/icons) to be used on top of primary backgrounds.
		 * Should ensure accessible contrast.
		 */
		primaryForeground: null,

		/**
		 * Secondary brand or accent color used for less prominent actions or highlights.
		 * Complementary hue to primary with similar saturation and lightness.
		 */
		secondary: null,

		/**
		 * Hover color for secondary brand or accent color used for less prominent actions or highlights.
		 * Complementary hue to primary with similar saturation and lightness.
		 */
		secondaryHover: null,

		/**
		 * Foreground color (text/icons) for secondary backgrounds.
		 * Ensure sufficient contrast and legibility.
		 */
		secondaryForeground: null,

		/**
		 * Destructive or error color used to indicate dangerous actions or errors.
		 * Balanced red-orange with similar saturation as primary for visual weight.
		 */
		destructive: null,

		/**
		 * Hover color for destructive or error actions.
		 * Complementary hue to destructive with similar saturation and lightness.
		 */
		destructiveHover: null,

		/**
		 * Foreground color on destructive backgrounds.
		 * High contrast to maintain accessibility.
		 */
		destructiveForeground: null,

		/**
		 * Color used for focus rings and outlines around interactive elements.
		 * Semi-transparent variant of primary to maintain brand identity.
		 */
		ring: null,

		/**
		 * Background offset color used beneath focus rings to improve visibility.
		 * Typically matches surface or background color.
		 */
		ringOffset: null,
	},
	gradient: {
		primary: null,
	},
	shadow: {
		/** Subtle small shadow for slight depth on elements */
		sm: null,

		/** Medium shadow for moderate elevation */
		md: null,

		/** Large shadow for prominent elevation */
		lg: null,

		/** Shadow or outline used for focused states */
		focus: null,
	},
});
