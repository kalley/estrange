import { style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

export const container = style({
	perspective: "200px",
});

export const glitchText = recipe({
	base: {
		fontFamily: "Space Grotesk",
		display: "inline-block",
		position: "relative",
		transformStyle: "preserve-3d",
		transition: "transform 0.5s ease",
		"::before": {
			content: "attr(data-char)",
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			color: "currentColor",
			opacity: 0.3,
			transition: "transform 0.75s ease, opacity 0.75s ease",
		},
	},
	variants: {
		glitchType: {
			shiftLeft: {
				transform: "translate3d(-1px, 0, -8px)",
				transitionDelay: "var(--delay, 0s)",
				"::before": {
					transform: "translate3d(-2px, 0, -10px) scale(1.2)",
				},
			},
			shiftRight: {
				transform: "translate3d(1px, 0, -8px)",
				transitionDelay: "var(--delay, 0s)",
				"::before": {
					transform: "translate3d(2px, 0, -10px) scale(1.2)",
				},
			},
		},
	},
});
