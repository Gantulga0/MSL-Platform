import { SetMetadata } from '@nestjs/common';
import type { Role } from '@msl/types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more roles. RolesGuard enforces "at least the
 * lowest listed role" via the RBAC rank ladder (AUTH-06). Server-side only.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
