import { Module } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { TopicsController } from './topics.controller';
import { LevelsController } from './levels.controller';
import { AgeGroupsController } from './age-groups.controller';

@Module({
  controllers: [TopicsController, LevelsController, AgeGroupsController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
