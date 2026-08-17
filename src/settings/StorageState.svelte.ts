export class StorageState<Value> {
	private readonly storage?: Storage;
	private storedValue = $state<Value>();
	public loaded = $state(false);

	public constructor(
		storageKind: "local" | "session",
		private readonly storageKey: string,
		initialValue: Value,
		private readonly reviver?: (this: void, key: string, value: unknown) => unknown,
	) {
		this.storedValue = structuredClone(initialValue);

		if (typeof window === "undefined") {
			return;
		}
		this.storage = window[`${storageKind}Storage`];

		const storedValue = this.storage.getItem(this.storageKey);
		if (storedValue !== null) {
			try {
				this.storedValue = JSON.parse(storedValue, reviver) as Value;
			} catch {
				// Ignore JSON parse errors
			}
		}

		// To handle a deeply-reactive values change,
		// we need to use $effect to watch for changes and save them to storage.

		this.dispose = $effect.root(() => {
			window.addEventListener("storage", this);

			$effect(() => {
				this.saveValueToStorage(this.value);
			});

			return (): void => {
				window.removeEventListener("storage", this);
			};
		});

		this.loaded = true;
	}

	public dispose(): void {
		// Set in constructor
	}

	public handleEvent(event: StorageEvent): void {
		if (
			event.storageArea !== this.storage ||
			(event.key !== this.storageKey && event.key !== null)
		) {
			return;
		}
		const storedValue = this.storage.getItem(this.storageKey);
		if (storedValue) {
			this.storedValue = JSON.parse(storedValue, this.reviver) as Value;
		}
	}

	private saveValueToStorage(value: Value): void {
		if (value === null || value === undefined) {
			this.storage?.removeItem(this.storageKey);
		} else {
			this.storage?.setItem(this.storageKey, JSON.stringify(value));
		}
	}

	public get value(): Value {
		return this.storedValue as Value;
	}

	public set value(newValue: Value) {
		this.storedValue = newValue;
	}
}
