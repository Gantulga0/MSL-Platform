import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { ReviewService } from './review.service';
import { SubmissionsController } from './submissions.controller';

/** Word submissions + duplicate detection + review (FR-02/03/04/11/12/22/30). */
@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, ReviewService],
  exports: [SubmissionsService, ReviewService],
})
export class SubmissionsModule {}
