import { ZodSchema, infer as zodInfer } from 'zod';

export const foo = 'foo';

export function parse<T extends ZodSchema>(
  schema: T,
  input: URLSearchParams
): zodInfer<T> {
  throw new Error('parse function not implemented');
}

export function serialize<T extends ZodSchema>(
  schema: T,
  values: zodInfer<T>,
  defaultValues?: Partial<zodInfer<T>>
): URLSearchParams {
  throw new Error('serialize function not implemented');
}
