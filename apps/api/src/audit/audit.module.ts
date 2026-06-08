import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/** Global audit module — AuditService available everywhere (FR-23, NFR-12). */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
