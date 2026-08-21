/** Drives one isolated Rapfi WASM instance (running in its own Worker) over the Gomocup protocol. */
export class RapfiEngine {
	private readonly worker: Worker;
	private nextId = 0;
	private readonly pending = new Map<
		number,
		{
			resolve: (result: { reply: string; errors: string[] }) => void;
			reject: (error: Error) => void;
		}
	>();

	public constructor() {
		this.worker = new Worker(new URL("./rapfi-worker.js", import.meta.url));
		this.worker.onmessage = (event) => {
			const { id, result, error } = event.data as {
				id: number;
				result?: { reply: string; errors: string[] };
				error?: string;
			};
			const handlers = this.pending.get(id);
			this.pending.delete(id);
			if (error) {
				handlers?.reject(new Error(error));
			} else if (result) {
				handlers?.resolve(result);
			}
		};
	}

	private send(command: string): Promise<{ reply: string; errors: string[] }> {
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.worker.postMessage({ id, command });
		});
	}

	public async init(boardSize: number, turnTimeMs: number): Promise<void> {
		await this.send("__init__");
		await this.send(`START ${boardSize}`);
		await this.send("INFO RULE 6");
		await this.send(`INFO TIMEOUT_TURN ${turnTimeMs}`);
	}

	/** Asks the engine (as opener, empty board) to propose the 3 Swap2 opening stones. */
	public async proposeOpening(): Promise<string> {
		const { reply } = await this.send("SWAP2BOARD\nDONE");
		return reply;
	}

	/** Asks the engine to decide "SWAP" or make its move, given the current opening position. */
	public async decideSwap(position: string[]): Promise<string> {
		const { reply } = await this.send(`SWAP2BOARD\n${position.join("\n")}\nDONE`);
		return reply;
	}

	/** Asks the engine for its next move given the full current position. */
	public async nextMove(position: string[]): Promise<string> {
		const { reply } = await this.send(`BOARD\n${position.join("\n")}\nDONE`);
		return reply;
	}

	public terminate(): void {
		this.worker.terminate();
	}
}
