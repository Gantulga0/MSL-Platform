import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';

/** Admin dashboard, reports, settings, consents, audit, imports + user management
 *  (FR-06/23/24/25, S-25/26/29/31/32/33/34, G-13). */
@Module({
  controllers: [AdminController, UsersController],
  providers: [AdminService, UsersService],
})
export class AdminModule {}
