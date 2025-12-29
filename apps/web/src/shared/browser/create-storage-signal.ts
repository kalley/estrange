import {
	type Accessor,
	batch,
	createSignal,
	onCleanup,
	onMount,
	untrack,
} from "solid-js";

type StorageValue<T> = T | (() => T);
type SetValue<T> = (value: T | ((prev: T) => T)) => void;

function isInitializer<T>(value: StorageValue<T>): value is () => T {
	return typeof value === "function";
}

function isSetter<T>(
	value: Parameters<SetValue<T>>[0],
): value is (prev: T) => T {
	return typeof value === "function";
}

const EMPTY_JSON_STRING = "{}";

export function createStorageSignal<T>(
	key: string,
	initialState: T | (() => T),
	expirationHours?: number,
	storage = window.localStorage,
): [Accessor<T>, SetValue<T>] {
	let isUpdating = false;
	let inEffect = false; // Track if we're in a reactive effect

	const getInitialState = (): T => {
		if (isInitializer(initialState)) {
			return initialState();
		}
		return initialState;
	};

	const getValue = () => {
		try {
			const storedState = storage.getItem(key);

			if (storedState && storedState !== EMPTY_JSON_STRING) {
				const { value, expiration } = JSON.parse(storedState);

				if (!expiration || expiration > Date.now()) {
					return value === undefined ? JSON.parse(storedState) : value;
				}

				storage.removeItem(key);
			}

			return getInitialState();
		} catch {
			return getInitialState();
		}
	};

	const [state, setState] = createSignal<T>(getValue());

	const handleStorageEvent = (event: StorageEvent) => {
		if (event.storageArea !== storage || event.key !== key || isUpdating) {
			return;
		}

		// Use untrack to prevent creating dependencies in any effects
		untrack(() => {
			inEffect = true;
			setState(getValue());
			inEffect = false;
		});
	};

	onMount(() => {
		window.addEventListener("storage", handleStorageEvent);
	});

	onCleanup(() => {
		window.removeEventListener("storage", handleStorageEvent);
	});

	const setStoredState: SetValue<T> = (value) => {
		if (inEffect) {
			console.warn(
				`Updating storage signal "${key}" from within an effect - this may cause loops`,
			);
		}

		isUpdating = true;
		const oldState = state();

		try {
			const newValue = isSetter(value) ? value(oldState) : value;
			const expiration = expirationHours
				? Date.now() + expirationHours * 60 * 60 * 1000
				: undefined;
			const stringifiedNewValue = JSON.stringify({
				value: newValue,
				expiration,
			});

			storage.setItem(key, stringifiedNewValue);

			// Batch these to happen atomically
			batch(() => {
				setState(() => newValue);
			});

			window.dispatchEvent(
				new StorageEvent("storage", {
					key,
					newValue: stringifiedNewValue,
					oldValue: JSON.stringify({ value: oldState, expiration }),
					storageArea: storage,
				}),
			);
		} catch (error) {
			console.error(`Failed to update storage for key "${key}":`, error);
		} finally {
			isUpdating = false;
		}
	};

	return [state, setStoredState];
}
