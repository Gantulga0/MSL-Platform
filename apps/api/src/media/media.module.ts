import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';
import { MediaController } from './media.controller';
import { ConsentsController } from './consents.controller';

@Module({
  controllers: [MediaController, ConsentsController],
  providers: [MediaService, StorageService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
