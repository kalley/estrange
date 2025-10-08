export const ZWS = "\u200B";

export const getZWSCount = (text: string) => {
	let count = 0;
	let i = text.indexOf(ZWS);

	while (i !== -1) {
		count++;
		i = text.indexOf(ZWS, i + 1);
	}

	return count;
};

export const hasZWS = (text: string): boolean => text.includes(ZWS);

export const startsWithZWS = (text: string): boolean => text.startsWith(ZWS);

export const stripZWS = (text: string): string => text.replaceAll(ZWS, "");

export const normalizeZWS = (text: string): string =>
	text.length === 0 ? ZWS : ZWS + stripZWS(text);

export const isOnlyZWS = (text: string): boolean =>
	text.length === getZWSCount(text);
