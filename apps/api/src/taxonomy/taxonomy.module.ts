import { Module } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { TopicsController } from './topics.controller';
import { LevelsController } from './levels.controller';
import { AgeGroupsController } from './age-groups.controller';
import { SignLocationsController } from './sign-locations.controller';
import { SignMovementsController } from './sign-movements.controller';

@Module({
  controllers: [
    TopicsController,
    LevelsController,
    AgeGroupsController,
    SignLocationsController,
    SignMovementsController,
  ],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
