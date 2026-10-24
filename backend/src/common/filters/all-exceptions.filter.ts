import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface FieldError {
  field: string;
  message: string;
}

/** The single error shape every endpoint returns. */
export interface ErrorEnvelope {
  code: string;
  message: string;
  fieldErrors?: FieldError[];
  requestId: string;
}

const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'validation_error',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'method_not_allowed',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'payload_too_large',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable_entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'rate_limited',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal_error',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service_unavailable',
};

type RequestWithIds = Request & { id?: string; requestId?: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithIds>();

    const requestId =
      request.requestId ??
      (typeof request.id === 'string' ? request.id : undefined) ??
      'unknown';

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'internal_error';
    let message = 'Internal server error';
    let fieldErrors: FieldError[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = STATUS_CODES[status] ?? 'http_error';
      message = exception.message;

      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const payload = body as Record<string, unknown>;
        if (typeof payload.code === 'string') code = payload.code;
        if (typeof payload.message === 'string') {
          message = payload.message;
        } else if (
          Array.isArray(payload.message) &&
          payload.message.length > 0
        ) {
          message = payload.message.join('; ');
        }
        if (Array.isArray(payload.fieldErrors)) {
          fieldErrors = payload.fieldErrors.filter(
            (item): item is FieldError =>
              !!item &&
              typeof item === 'object' &&
              typeof (item as FieldError).field === 'string' &&
              typeof (item as FieldError).message === 'string',
          );
        }
      }
    } else {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        stack,
      );
    }

    const envelope: ErrorEnvelope = {
      code,
      message,
      ...(fieldErrors && fieldErrors.length > 0 ? { fieldErrors } : {}),
      requestId,
    };

    response.status(status).json(envelope);
  }
}
