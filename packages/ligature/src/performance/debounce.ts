export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	delay: number,
) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const debounced = function (
		this: ThisParameterType<T>,
		...args: Parameters<T>
	) {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func.apply(this, args);
			timeoutId = null;
		}, delay);
	};

	debounced.cancel = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return debounced;
}
