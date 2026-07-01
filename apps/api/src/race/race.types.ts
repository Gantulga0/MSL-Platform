// In-memory model for the realtime "Sign TypeRacer" multiplayer rooms.
//
// Only race coordination flows over the socket — room membership, the shared
// target word, per-player letter progress and finish times. Sign recognition
// runs entirely client-side per player; no video or landmark data is ever sent.

export type RoomState = 'lobby' | 'racing' | 'finished';

export interface RacePlayer {
  id: string; // socket id
  name: string;
  /** Letters completed so far (index into the shared word). */
  index: number;
  /** Client-reported elapsed time on finish (ms), or null while racing. */
  timeMs: number | null;
  /** 1-based finishing rank, or null until finished. */
  rank: number | null;
}

export interface RaceRoom {
  code: string;
  hostId: string;
  state: RoomState;
  /** The shared target word for the current race (null in lobby). */
  word: string | null;
  /** Finishing order of player ids (drives rank). */
  finishOrder: string[];
  /** Safety timer that force-finishes a stalled race. */
  timeout: ReturnType<typeof setTimeout> | null;
  players: Map<string, RacePlayer>;
}

/** Player shape sent over the wire (no internal timers/refs). */
export interface PublicPlayer {
  id: string;
  name: string;
  index: number;
  rank: number | null;
  timeMs: number | null;
  finished: boolean;
  isHost: boolean;
}

/** Full room snapshot broadcast on membership/state changes. */
export interface RoomSnapshot {
  code: string;
  hostId: string;
  state: RoomState;
  word: string | null;
  /** Number of letters in the target word (so clients can size progress bars). */
  wordLength: number;
  players: PublicPlayer[];
}
