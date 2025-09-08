import type { ComponentProps, JSX, ParentProps } from "solid-js";

export const Svg = ({
	size = 32,
	viewBox = "0 0 130 130",
	class: className,
	title,
	children,
	...props
}: ParentProps<
	JSX.SVGElementTags["svg"] & {
		size?: number;
		title?: string;
	}
>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox={viewBox}
		fill="currentColor"
		class={className}
		role={title ? "img" : "presentation"}
		aria-label={title}
		{...props}
	>
		{title && <title>{title}</title>}
		{children}
	</svg>
);

export type SvgProps = ComponentProps<typeof Svg>;
