import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_RANK, type Role } from '@msl/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestWithUser } from '../auth.types';

/**
 * RBAC authorization guard (AUTH-06, NFR-04). Runs after JwtAuthGuard. If a route
 * declares @Roles, the authenticated user must hold at least the lowest-ranked
 * required role. No @Roles → any authenticated user passes. Deny by default.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required');

    const minRank = Math.min(...required.map((r) => ROLE_RANK[r]));
    if (ROLE_RANK[user.role] < minRank) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
