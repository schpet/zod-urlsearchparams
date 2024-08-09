import type { ZodSchema, infer as zodInfer } from "zod";

export function parse<T extends ZodSchema>(
	schema: T,
	input: URLSearchParams,
): zodInfer<T> {
	const obj: Record<string, string> = {};
	for (const [key, value] of input.entries()) {
		obj[key] = value;
	}
	return schema.parse(obj);
}

export function serialize<T extends ZodSchema>(
	schema: T,
	values: zodInfer<T>,
	defaultValues?: Partial<zodInfer<T>>,
): URLSearchParams {
	const params = new URLSearchParams();

	const schemaShape = schema._def.shape();
	for (const key in values) {
		if (Object.hasOwn(values, key)) {
			const value = values[key];
			const schemaType = schemaShape[key];
			if (schemaType && schemaType._def.typeName === "ZodArray") {
				for (const item of value) {
					params.append(key, String(item));
				}
			} else {
				params.append(key, String(value));
			}
		}
	}

	return params;
}
