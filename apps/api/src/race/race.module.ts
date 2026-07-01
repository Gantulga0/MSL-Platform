import { Module } from '@nestjs/common';
import { RaceGateway } from './race.gateway';

/** Realtime multiplayer "Sign TypeRacer" race coordination (WebSocket). */
@Module({
  providers: [RaceGateway],
})
export class RaceModule {}
