import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AdminController, UsersController],
  providers: [AdminService, UsersService],
})
export class AdminModule {}
