import { Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Public } from '../common/decorators/public.decorator';
import type { PublicPlayer, RacePlayer, RaceRoom, RoomSnapshot } from './race.types';

/** Ambiguous-character-free alphabet for human-readable room codes. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 4;
const MAX_PLAYERS = 8;
const MAX_NAME_LEN = 20;
const MAX_WORD_LEN = 24;
/** Force results if a race runs long (someone leaves their tab open). */
const RACE_TIMEOUT_MS = 5 * 60_000;

/**
 * Realtime gateway for the multiplayer "Sign TypeRacer" race.
 *
 * Rooms are held in memory — fine for the single-instance pilot. To scale
 * horizontally later, swap the in-memory registry for the socket.io Redis
 * adapter (Redis is already available for BullMQ) so rooms are shared across
 * instances; the event contract below would not change.
 *
 * `@Public()` + `@SkipThrottle()` opt this gateway out of the global HTTP
 * JWT/throttle guards (the game is anonymous; the JWT guard also early-returns
 * for non-HTTP contexts).
 */
@Public()
@SkipThrottle()
@WebSocketGateway({ namespace: 'race', cors: { origin: true, credentials: true } })
export class RaceGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly log = new Logger('RaceGateway');
  private readonly rooms = new Map<string, RaceRoom>();
  /** socket id → room code (a socket is in at most one room). */
  private readonly socketRoom = new Map<string, string>();

  // The client learns its room code / player id via an explicit `race:joined`
  // event (and `race:error` on failure) rather than a socket.io ack callback —
  // emit-back is unambiguous across Nest versions and easy to reason about.
  @SubscribeMessage('race:create')
  onCreate(@MessageBody() body: { name?: string }, @ConnectedSocket() socket: Socket): void {
    this.leaveCurrentRoom(socket);
    const code = this.makeCode();
    const player = newPlayer(socket.id, body?.name);
    const room: RaceRoom = {
      code,
      hostId: socket.id,
      state: 'lobby',
      word: null,
      finishOrder: [],
      timeout: null,
      players: new Map([[socket.id, player]]),
    };
    this.rooms.set(code, room);
    this.socketRoom.set(socket.id, code);
    void socket.join(code);
    socket.emit('race:joined', { code, you: socket.id });
    this.broadcastRoom(room);
  }

  @SubscribeMessage('race:join')
  onJoin(
    @MessageBody() body: { code?: string; name?: string },
    @ConnectedSocket() socket: Socket,
  ): void {
    const code = String(body?.code ?? '')
      .toUpperCase()
      .trim();
    const room = this.rooms.get(code);
    if (!room) return void socket.emit('race:error', { error: 'not_found' });
    if (room.players.size >= MAX_PLAYERS) return void socket.emit('race:error', { error: 'full' });
    if (room.state !== 'lobby') return void socket.emit('race:error', { error: 'in_progress' });

    this.leaveCurrentRoom(socket);
    room.players.set(socket.id, newPlayer(socket.id, body?.name));
    this.socketRoom.set(socket.id, code);
    void socket.join(code);
    socket.emit('race:joined', { code, you: socket.id });
    this.broadcastRoom(room);
  }

  @SubscribeMessage('race:start')
  onStart(
    @MessageBody() body: { word?: string },
    @ConnectedSocket() socket: Socket,
  ): void {
    const room = this.roomOf(socket);
    if (!room || room.hostId !== socket.id || room.state !== 'lobby') return;
    const word = sanitizeWord(body?.word);
    if (!word) return;

    room.word = word;
    room.state = 'racing';
    room.finishOrder = [];
    for (const p of room.players.values()) {
      p.index = 0;
      p.timeMs = null;
      p.rank = null;
    }
    this.broadcastRoom(room);
    // Each client runs its own pre-race countdown on receipt, then starts its
    // local timer — we avoid wall-clock sync (good enough for a casual race).
    this.server.to(room.code).emit('race:started', { word });

    if (room.timeout) clearTimeout(room.timeout);
    room.timeout = setTimeout(() => this.finalize(room), RACE_TIMEOUT_MS);
  }

  @SubscribeMessage('race:progress')
  onProgress(
    @MessageBody() body: { index?: number },
    @ConnectedSocket() socket: Socket,
  ): void {
    const room = this.roomOf(socket);
    if (!room || room.state !== 'racing') return;
    const player = room.players.get(socket.id);
    if (!player || player.rank !== null) return;
    const wordLen = room.word?.length ?? 0;
    const index = clampInt(body?.index, 0, wordLen);
    if (index <= player.index) return; // only forward progress
    player.index = index;
    this.server.to(room.code).emit('race:progress', { playerId: socket.id, index });
  }

  @SubscribeMessage('race:finish')
  onFinish(
    @MessageBody() body: { timeMs?: number },
    @ConnectedSocket() socket: Socket,
  ): void {
    const room = this.roomOf(socket);
    if (!room || room.state !== 'racing') return;
    const player = room.players.get(socket.id);
    if (!player || player.rank !== null) return;

    const wordLen = room.word?.length ?? 0;
    player.index = wordLen;
    player.timeMs = clampInt(body?.timeMs, 0, RACE_TIMEOUT_MS);
    room.finishOrder.push(socket.id);
    player.rank = room.finishOrder.length;
    this.server.to(room.code).emit('race:finished', {
      playerId: socket.id,
      timeMs: player.timeMs,
      rank: player.rank,
    });

    // Everyone (still connected) done → results now.
    const pending = [...room.players.values()].filter((p) => p.rank === null);
    if (pending.length === 0) this.finalize(room);
  }

  @SubscribeMessage('race:leave')
  onLeave(@ConnectedSocket() socket: Socket): void {
    this.leaveCurrentRoom(socket);
  }

  handleDisconnect(socket: Socket): void {
    this.leaveCurrentRoom(socket);
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private finalize(room: RaceRoom): void {
    if (room.timeout) {
      clearTimeout(room.timeout);
      room.timeout = null;
    }
    room.state = 'finished';
    // Unfinished players rank after finishers, ordered by furthest progress.
    const unfinished = [...room.players.values()]
      .filter((p) => p.rank === null)
      .sort((a, b) => b.index - a.index);
    let rank = room.finishOrder.length;
    for (const p of unfinished) p.rank = ++rank;

    this.server.to(room.code).emit('race:results', {
      ranking: snapshot(room).players.sort(byRank),
    });
    this.broadcastRoom(room);
  }

  private leaveCurrentRoom(socket: Socket): void {
    const code = this.socketRoom.get(socket.id);
    if (!code) return;
    this.socketRoom.delete(socket.id);
    void socket.leave(code);
    const room = this.rooms.get(code);
    if (!room) return;
    room.players.delete(socket.id);

    if (room.players.size === 0) {
      if (room.timeout) clearTimeout(room.timeout);
      this.rooms.delete(code);
      return;
    }
    // Promote a new host if the host left.
    if (room.hostId === socket.id) {
      room.hostId = room.players.keys().next().value as string;
    }
    // A mid-race departure may leave everyone else already finished.
    if (room.state === 'racing') {
      const pending = [...room.players.values()].filter((p) => p.rank === null);
      if (pending.length === 0) {
        this.finalize(room);
        return;
      }
    }
    this.broadcastRoom(room);
  }

  private roomOf(socket: Socket): RaceRoom | undefined {
    const code = this.socketRoom.get(socket.id);
    return code ? this.rooms.get(code) : undefined;
  }

  private broadcastRoom(room: RaceRoom): void {
    this.server.to(room.code).emit('race:room', snapshot(room));
  }

  private makeCode(): string {
    let code = '';
    do {
      code = '';
      for (let i = 0; i < CODE_LEN; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }
}

function newPlayer(id: string, rawName?: string): RacePlayer {
  const name = String(rawName ?? '').trim().slice(0, MAX_NAME_LEN) || 'Тоглогч';
  return { id, name, index: 0, timeMs: null, rank: null };
}

function sanitizeWord(raw?: string): string | null {
  const word = String(raw ?? '').trim();
  if (word.length < 2 || word.length > MAX_WORD_LEN) return null;
  return word;
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function toPublic(p: RacePlayer, hostId: string): PublicPlayer {
  return {
    id: p.id,
    name: p.name,
    index: p.index,
    rank: p.rank,
    timeMs: p.timeMs,
    finished: p.rank !== null,
    isHost: p.id === hostId,
  };
}

function snapshot(room: RaceRoom): RoomSnapshot {
  return {
    code: room.code,
    hostId: room.hostId,
    state: room.state,
    word: room.word,
    wordLength: room.word?.length ?? 0,
    players: [...room.players.values()].map((p) => toPublic(p, room.hostId)),
  };
}

function byRank(a: PublicPlayer, b: PublicPlayer): number {
  return (a.rank ?? 99) - (b.rank ?? 99);
}
