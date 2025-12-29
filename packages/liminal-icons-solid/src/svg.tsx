import {
	type ComponentProps,
	type JSX,
	mergeProps,
	type ParentProps,
} from "solid-js";

export const Svg = (
	props: ParentProps<
		JSX.SVGElementTags["svg"] & {
			size?: number;
			title?: string;
		}
	>,
) => {
	const merged = mergeProps({ size: 32, viewBox: "0 0 130 130" }, props);

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={merged.size}
			height={merged.size}
			viewBox={merged.viewBox}
			fill="currentColor"
			class={merged.class}
			role={merged.title ? "img" : "presentation"}
			aria-label={merged.title}
			{...props}
		>
			{merged.title && <title>{merged.title}</title>}
			{merged.children}
		</svg>
	);
};

export type SvgProps = ComponentProps<typeof Svg>;
