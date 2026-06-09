import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Role } from '@msl/types';
import { RolesGuard } from './roles.guard';

function makeContext(user: { role: Role } | undefined): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeReflector(required: Role[] | undefined): Reflector {
  return { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector;
}

describe('RolesGuard (AUTH-06 RBAC)', () => {
  it('allows any authenticated user when no @Roles is set', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeContext({ role: 'user' }))).toBe(true);
  });

  it('allows a user holding exactly the required role', () => {
    const guard = new RolesGuard(makeReflector(['admin']));
    expect(guard.canActivate(makeContext({ role: 'admin' }))).toBe(true);
  });

  it('denies a regular user on admin-only routes', () => {
    const guard = new RolesGuard(makeReflector(['admin']));
    expect(() => guard.canActivate(makeContext({ role: 'user' }))).toThrow(ForbiddenException);
  });

  it('denies when there is no authenticated user', () => {
    const guard = new RolesGuard(makeReflector(['user']));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
