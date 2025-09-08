import { breakpoints } from "../tokens/breakpoints";

const breakpointsAsc = ["base", "sm", "md", "lg", "xl"] as const;
const breakpointsDesc = ["xl", "lg", "md", "sm", "base"] as const;

type Breakpoint = (typeof breakpointsAsc)[number];

function createNestedFallbackVar(
	varName: string,
	breakpoint: Breakpoint,
	fallbackOrder: readonly Breakpoint[],
	fallbackValue: string,
): string {
	const startIndex = fallbackOrder.indexOf(breakpoint);
	const relevant = fallbackOrder.slice(startIndex);

	return relevant.reduceRight((acc, bp) => {
		const suffix = bp === "base" ? "" : `-${bp}`;
		return `var(${varName}${suffix}, ${acc})`;
	}, fallbackValue);
}

type ResponsiveVars<T> = Record<`--${T & string}-responsive`, string>;

export function createResponsiveVars<T extends string>(
	baseVars: Record<T, string>,
	responsiveVars: T[],
): {
	vars: ResponsiveVars<T>;
	"@media": Record<string, { vars: ResponsiveVars<T> }>;
} {
	const vars: ResponsiveVars<T> = {} as ResponsiveVars<T>;
	const mediaVars: Record<string, { vars: ResponsiveVars<T> }> = {};

	for (const bp of breakpointsAsc) {
		const fallback = responsiveVars.reduce(
			(acc, key) => {
				acc[`--${key}-responsive`] = createNestedFallbackVar(
					`--${key}`,
					bp,
					breakpointsDesc,
					baseVars[key],
				);
				return acc;
			},
			{} as ResponsiveVars<T>,
		);

		if (bp === "base") {
			Object.assign(vars, fallback);
		} else {
			mediaVars[`screen and (min-width: ${breakpoints[bp]})`] = {
				vars: fallback,
			};
		}
	}

	return {
		vars,
		"@media": mediaVars,
	};
}

export type ResponsiveValue<T> =
	| T
	| ({ base?: T } & Partial<Record<Breakpoint, T>>);

type CSSVariables = Record<`--${string}`, string>;

export function toCssVars<T>(
	value: ResponsiveValue<T> | T | undefined,
	cssVarName: `--${string}`,
	transform?: (val: T) => string,
): CSSVariables {
	if (!value) return {};

	const apply = (v: T) => (transform ? transform(v) : String(v));
	if (typeof value !== "object" || value === null) {
		return { [cssVarName]: apply(value) };
	}

	const vars: CSSVariables = {};
	for (const [bp, v] of Object.entries(value)) {
		if (bp === "sm") {
			if (v != null) vars[cssVarName] = apply(v);
		} else if (bp in breakpoints) {
			if (v != null) vars[`${cssVarName}-${bp}`] = apply(v);
		}
	}
	return vars;
}
