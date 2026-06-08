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
    expect(guard.canActivate(makeContext({ role: 'learner' }))).toBe(true);
  });

  it('allows a user holding exactly the required role', () => {
    const guard = new RolesGuard(makeReflector(['teacher']));
    expect(guard.canActivate(makeContext({ role: 'teacher' }))).toBe(true);
  });

  it('allows a more-privileged user (admin outranks teacher)', () => {
    const guard = new RolesGuard(makeReflector(['teacher']));
    expect(guard.canActivate(makeContext({ role: 'admin' }))).toBe(true);
  });

  it('denies an under-privileged user', () => {
    const guard = new RolesGuard(makeReflector(['teacher']));
    expect(() => guard.canActivate(makeContext({ role: 'contributor' }))).toThrow(
      ForbiddenException,
    );
  });

  it('denies when there is no authenticated user', () => {
    const guard = new RolesGuard(makeReflector(['contributor']));
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
