import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ZOD_SCHEMA,
  ZodValidationPipe,
  createZodDto,
} from './zod-validation.pipe.js';

const CreateThingDto = createZodDto(
  z.object({
    title: z.string().min(3, 'title is too short'),
    count: z.coerce.number().int().positive().optional(),
  }),
);

const bodyMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateThingDto,
};

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe();

  it('passes through values when the metatype has no Zod schema', () => {
    const value = { anything: true };

    expect(pipe.transform(value, { type: 'body', metatype: Object })).toBe(
      value,
    );
    expect(pipe.transform(value, { type: 'query' })).toBe(value);
  });

  it('returns the parsed value for valid input', () => {
    const result = pipe.transform({ title: 'Hello', count: '3' }, bodyMetadata);

    expect(result).toEqual({ title: 'Hello', count: 3 });
  });

  it('throws the standard validation error shape for invalid input', () => {
    try {
      pipe.transform({ title: 'ab' }, bodyMetadata);
      throw new Error('expected the pipe to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as Record<
        string,
        unknown
      >;

      expect(response.code).toBe('validation_error');
      expect(response.message).toBe('Validation failed');
      expect(response.fieldErrors).toEqual([
        { field: 'title', message: 'title is too short' },
      ]);
    }
  });

  it('exposes the schema on the generated DTO class', () => {
    expect(
      (CreateThingDto as unknown as Record<string, unknown>)[ZOD_SCHEMA],
    ).toBeDefined();
  });
});
