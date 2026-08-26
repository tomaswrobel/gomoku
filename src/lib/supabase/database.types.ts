// Hand-written to match supabase/migrations/*.sql — regenerate with
// `supabase gen types typescript --local > src/lib/supabase/database.types.ts` once the Supabase
// CLI/Docker is available in this environment.

export type OpeningRule = "swap2" | "standard";
export type SeatColor = "Black" | "White";
export type GameStatus = "waiting" | "active" | "finished" | "aborted";
export type GameResult = "win" | "draw";
export type TimeControl = "15" | "30" | "60";
export type GameKind = "1v1" | "room";
export type GamePhase = "opening" | "decide1" | "balance" | "decide2" | "playing";
export type SwapDecision = "keep" | "swap";

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					discord_id: string;
					display_name: string;
					avatar_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
				Relationships: [];
			};
			tables: {
				Row: {
					id: number;
					label: string;
				};
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
				Relationships: [];
			};
			games: {
				Row: {
					id: string;
					kind: GameKind;
					table_id: number | null;
					opening_rule: OpeningRule;
					time_control: TimeControl;
					status: GameStatus;
					phase: GamePhase;
					result: GameResult | null;
					swapped: boolean;
					winner_color: SeatColor | null;
					player1_id: string | null;
					player2_id: string | null;
					player1_name: string;
					player2_name: string;
					player1_clock_ms: number;
					player2_clock_ms: number;
					clock_running_since: string | null;
					created_at: string;
					started_at: string | null;
					finished_at: string | null;
				};
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
				Relationships: [];
			};
			moves: {
				Row: {
					game_id: string;
					move_number: number;
					coordinate: string;
					player_id: string | null;
					created_at: string;
				};
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
				Relationships: [];
			};
			room_seats: {
				Row: {
					table_id: number;
					seat: 1 | 2;
					player_id: string;
					game_id: string | null;
					seated_at: string;
				};
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: {
			create_game: {
				Args: {
					p_kind: GameKind;
					p_table_id: number | null;
					p_opponent_id: string;
					p_opening_rule: OpeningRule;
					p_time_control: TimeControl;
				};
				Returns: Database["public"]["Tables"]["games"]["Row"];
			};
			sit_at_table: {
				Args: { p_table_id: number; p_time_control: TimeControl };
				Returns: Database["public"]["Tables"]["games"]["Row"] | null;
			};
			leave_table: {
				Args: { p_table_id: number };
				Returns: undefined;
			};
			play_move: {
				Args: { p_game_id: string; p_coordinate: string };
				Returns: Database["public"]["Tables"]["games"]["Row"];
			};
			check_flag: {
				Args: { p_game_id: string };
				Returns: Database["public"]["Tables"]["games"]["Row"];
			};
			decide_opening: {
				Args: { p_game_id: string; p_choice: SwapDecision };
				Returns: Database["public"]["Tables"]["games"]["Row"];
			};
			place_two_more: {
				Args: { p_game_id: string };
				Returns: Database["public"]["Tables"]["games"]["Row"];
			};
		};
		Enums: {
			opening_rule: OpeningRule;
			seat_color: SeatColor;
			game_status: GameStatus;
			game_phase: GamePhase;
			swap_decision: SwapDecision;
			game_result: GameResult;
			time_control: TimeControl;
			game_kind: GameKind;
		};
	};
}
