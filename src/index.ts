import type { ZodSchema, infer as zodInfer } from "zod";

export function parse<T extends ZodSchema>(
	schema: T,
	input: URLSearchParams,
): zodInfer<T> {
	throw new Error("parse function not implemented");
}

export function serialize<T extends ZodSchema>(
	schema: T,
	values: zodInfer<T>,
	defaultValues?: Partial<zodInfer<T>>,
): URLSearchParams {
	const params = new URLSearchParams();

	for (const key in values) {
		if (values.hasOwnProperty(key)) {
			params.append(key, String(values[key]));
		}
	}

	return params;
}
