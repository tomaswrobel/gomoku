import { Difficulty } from "../settings/Difficulty.ts";

/// How long (in ms) Rapfi is allowed to think per turn at each difficulty. This is the only
/// strength knob exposed by the Gomocup protocol without editing the engine's own config file.
export const difficultyTurnTime: Record<Difficulty, number> = {
	[Difficulty.Easy]: 500,
	[Difficulty.Medium]: 3000,
	[Difficulty.Hard]: 9000,
};
