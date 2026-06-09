import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import type { RequestWithUser } from '../common/auth.types';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const method = request.method;

    if (!MUTATING.has(method)) return next.handle();

    const path = request.originalUrl ?? request.url;
    const actorId = request.user?.id ?? null;
    const ip = request.ip ?? null;

    return next.handle().pipe(
      tap(() => {
        void this.audit.record({
          actorId,
          entityType: 'http_request',
          action: `${method} ${stripQuery(path)}`,
          ip,
        });
      }),
    );
  }
}

function stripQuery(path: string): string {
  const i = path.indexOf('?');
  return i === -1 ? path : path.slice(0, i);
}
