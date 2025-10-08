export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	delay: number,
) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let pendingArgs: Parameters<T> | null = null;
	let pendingContext: ThisParameterType<T> | null = null;

	const debounced = function (
		this: ThisParameterType<T>,
		...args: Parameters<T>
	) {
		pendingArgs = args;
		pendingContext = this;

		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			if (pendingArgs) func.apply(pendingContext, pendingArgs);
			timeoutId = null;
			pendingArgs = null;
			pendingContext = null;
		}, delay);
	};

	debounced.cancel = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
			pendingArgs = null;
			pendingContext = null;
		}
	};

	debounced.flush = () => {
		if (timeoutId && pendingArgs) {
			clearTimeout(timeoutId);
			func.apply(pendingContext, pendingArgs);
			timeoutId = null;
			pendingArgs = null;
			pendingContext = null;
		}
	};

	return debounced;
}
