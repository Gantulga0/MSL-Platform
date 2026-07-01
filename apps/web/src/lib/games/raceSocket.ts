'use client';

import { io, type Socket } from 'socket.io-client';

// The race gateway is attached to the API server under the `/race` namespace.
// NEXT_PUBLIC_API_BASE_URL points at the REST base (…/api/v1); strip that suffix
// to reach the server origin the socket connects to.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '');

export interface PublicPlayer {
  id: string;
  name: string;
  index: number;
  rank: number | null;
  timeMs: number | null;
  finished: boolean;
  isHost: boolean;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  state: 'lobby' | 'racing' | 'finished';
  word: string | null;
  wordLength: number;
  players: PublicPlayer[];
}

/** Open a fresh connection to the race namespace. Caller owns teardown. */
export function connectRace(): Socket {
  // Default transports (polling → websocket upgrade) — most robust handshake
  // across proxies/dev setups.
  return io(`${ORIGIN}/race`, { autoConnect: true, forceNew: true });
}
