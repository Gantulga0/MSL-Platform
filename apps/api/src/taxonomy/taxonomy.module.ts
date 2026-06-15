import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { TaxonomyService } from './taxonomy.service';
import { OptionImagesService } from './option-images.service';
import { TopicsController } from './topics.controller';
import { LevelsController } from './levels.controller';
import { AgeGroupsController } from './age-groups.controller';
import { HandednessController } from './handedness.controller';
import { OptionImagesController } from './option-images.controller';

@Module({
  imports: [MediaModule],
  controllers: [
    TopicsController,
    LevelsController,
    AgeGroupsController,
    HandednessController,
    OptionImagesController,
  ],
  providers: [TaxonomyService, OptionImagesService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
