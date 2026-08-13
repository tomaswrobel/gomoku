import { Difficulty } from "./Difficulty";

/// How long (in ms) Rapfi is allowed to think per turn at each difficulty. This is the only
/// strength knob exposed by the Gomocup protocol without editing the engine's own config file.
const TURN_TIME_MS: Record<Difficulty, number> = {
	[Difficulty.Easy]: 500,
	[Difficulty.Medium]: 3000,
	[Difficulty.Hard]: 9000,
};

export function difficultyTurnTime(difficulty: Difficulty): number {
	return TURN_TIME_MS[difficulty];
}
