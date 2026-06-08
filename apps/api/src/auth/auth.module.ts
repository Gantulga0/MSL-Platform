import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';

/**
 * Authentication & session management (SPEC §5). JwtModule is registered
 * globally in AppModule, so this module only needs its own services. RBAC is
 * enforced globally by JwtAuthGuard + RolesGuard (AUTH-06).
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, TokensService],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
