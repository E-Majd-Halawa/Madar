import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import type { ZodTypeAny, z } from 'zod';

export const ZOD_SCHEMA = 'madar:zodSchema';

export interface ZodDtoClass<T extends ZodTypeAny> {
  new (): z.infer<T>;
  [ZOD_SCHEMA]: T;
}

/** Wraps a Zod schema in a class so Nest can use it as a DTO metatype. */
export function createZodDto<T extends ZodTypeAny>(schema: T): ZodDtoClass<T> {
  class ZodDto {}
  Object.defineProperty(ZodDto, ZOD_SCHEMA, { value: schema });
  return ZodDto as unknown as ZodDtoClass<T>;
}

type ZodSchemaHolder = { [ZOD_SCHEMA]?: ZodTypeAny };

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const metatype = metadata.metatype as unknown as
      ZodSchemaHolder | undefined;
    const schema = metatype?.[ZOD_SCHEMA];

    if (!schema) return value;

    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Validation failed',
        fieldErrors: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
