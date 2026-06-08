import { Module } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { TopicsController } from './topics.controller';
import { LevelsController } from './levels.controller';
import { AgeGroupsController } from './age-groups.controller';

/** Topics (hierarchical) + levels + age groups (FR-08, S-27). */
@Module({
  controllers: [TopicsController, LevelsController, AgeGroupsController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
