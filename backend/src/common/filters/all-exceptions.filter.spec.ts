import { NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function createHost(request: Partial<Request>): {
  host: ArgumentsHost;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
} {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const response = { status } as unknown as Response;

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  it('wraps HTTP exceptions in the standard envelope', () => {
    const { host, status, json } = createHost({
      method: 'GET',
      url: '/does-not-exist',
      requestId: 'req-123',
    });

    new AllExceptionsFilter().catch(
      new NotFoundException('Cannot GET /does-not-exist'),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: 'not_found',
      message: 'Cannot GET /does-not-exist',
      requestId: 'req-123',
    });
  });

  it('keeps code, message and fieldErrors coming from the validation pipe', () => {
    const { host, json } = createHost({
      method: 'POST',
      url: '/api/v1/x',
      id: 'req-456',
    });

    new AllExceptionsFilter().catch(
      new NotFoundException({
        code: 'validation_error',
        message: 'Validation failed',
        fieldErrors: [{ field: 'title', message: 'Required' }],
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      code: 'validation_error',
      message: 'Validation failed',
      fieldErrors: [{ field: 'title', message: 'Required' }],
      requestId: 'req-456',
    });
  });

  it('hides internal error details', () => {
    const { host, status, json } = createHost({
      method: 'GET',
      url: '/api/v1/boom',
      requestId: 'req-789',
    });

    new AllExceptionsFilter().catch(
      new Error('database password leaked'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: 'internal_error',
      message: 'Internal server error',
      requestId: 'req-789',
    });
  });
});
