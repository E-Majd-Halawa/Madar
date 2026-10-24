import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';

type RequestWithIds = Request & { id?: string; requestId?: string };

/**
 * Guarantees every request has an id, echoes it in `x-request-id`, and makes it
 * available to the exception filter so the error envelope can include it.
 * `pino-http` normally sets `req.id` first; this is a safety net.
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithIds>();
    const response = http.getResponse<Response>();

    const requestId =
      (typeof request.id === 'string' && request.id) ||
      request.requestId ||
      randomUUID();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    return next.handle();
  }
}
