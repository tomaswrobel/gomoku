/// Cosmetic client-side countdown for one seat's clock bank: purely a local interval computing
/// `bankMs - elapsed since runningSince`, per decision #5 — never trusted for flag-fall, only the
/// `check_flag` RPC authoritatively decides that. Call `update()` whenever the server sends a new
/// `games` row (clock bank / clock_running_since change).
export class RemoteClock {
	public remainingMs = $state(0);

	private bankMs = 0;
	private runningSince: number | null = null;
	private intervalId: ReturnType<typeof setInterval> | undefined;

	public constructor(bankMs: number, runningSince: string | null) {
		this.update(bankMs, runningSince);
	}

	public update(bankMs: number, runningSince: string | null): void {
		this.bankMs = bankMs;
		this.runningSince = runningSince ? new Date(runningSince).getTime() : null;
		this.tick();

		clearInterval(this.intervalId);
		if (this.runningSince !== null) {
			this.intervalId = setInterval(() => this.tick(), 250);
		}
	}

	private tick(): void {
		if (this.runningSince === null) {
			this.remainingMs = this.bankMs;
			return;
		}
		const elapsed = Date.now() - this.runningSince;
		this.remainingMs = Math.max(0, this.bankMs - elapsed);
	}

	public destroy(): void {
		clearInterval(this.intervalId);
	}
}
