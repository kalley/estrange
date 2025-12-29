import {
	type Accessor,
	createContext,
	createSignal,
	onCleanup,
	onMount,
	type ParentProps,
	useContext,
} from "solid-js";

type ModalEvent = "close";

function createModalController<Event extends ModalEvent>(events: Event[]) {
	const listeners = new Map<Event, Set<() => void>>();

	for (const event of events) {
		listeners.set(event, new Set());
	}

	function on(event: Event, cb: () => void) {
		listeners.get(event)?.add(cb);
		return () => listeners.get(event)?.delete(cb);
	}

	function off(event: Event, cb: () => void) {
		listeners.get(event)?.delete(cb);
	}

	function trigger(event: Event) {
		listeners.get(event)?.forEach((cb) => {
			cb();
		});
	}

	return { on, off, trigger };
}

const ModalContext = createContext<
	ReturnType<typeof createModalController> & {
		isOpen: Accessor<boolean>;
		openPrompt: () => void;
		closePrompt: () => void;
	}
>();

export function ModalProvider(props: ParentProps) {
	const [isOpen, setIsOpen] = createSignal(false);
	const controller = createModalController(["close"]);

	function openPrompt() {
		setIsOpen(true);
	}

	function closePrompt() {
		setIsOpen(false);
	}

	return (
		<ModalContext.Provider
			value={{
				isOpen,
				openPrompt,
				closePrompt,
				...controller,
			}}
		>
			{props.children}
		</ModalContext.Provider>
	);
}

type ModalOptions = { on?: Partial<Record<ModalEvent, () => void>> };

export function useModal(options: ModalOptions = {}) {
	const context = useContext(ModalContext);
	if (!context) {
		throw new Error("useModal must be used within a ModalProvider");
	}

	if (options) {
		onMount(() => {
			if (options.on) {
				for (const [event, callback] of Object.entries(options.on)) {
					context.on(event as ModalEvent, callback);
				}
			}
		});

		onCleanup(() => {
			if (options.on) {
				for (const [event, callback] of Object.entries(options.on)) {
					context.off(event as ModalEvent, callback);
				}
			}
		});
	}

	return context;
}
