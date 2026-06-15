import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';
import { MediaController } from './media.controller';
import { ConsentsController } from './consents.controller';

/** Media upload/storage + consent (FR-24, AUTH-09/10, G-7). */
@Module({
  controllers: [MediaController, ConsentsController],
  providers: [MediaService, StorageService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
