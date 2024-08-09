import type { ZodObject, ZodTypeAny, infer as zodInfer } from "zod";

type Schema = ZodObject<Record<string, ZodTypeAny>>;

export function parse<T extends Schema>(
	schema: T,
	input: URLSearchParams,
): zodInfer<T> {
	const obj: Record<string, string> = {};
	for (const [key, value] of input.entries()) {
		obj[key] = value;
	}
	return schema.parse(obj);
}

export function serialize<T extends Schema>(
	schema: T,
	values: zodInfer<T>,
	defaultValues?: Partial<zodInfer<T>>,
): URLSearchParams {
	const params = new URLSearchParams();

	const schemaShape = schema.shape
	for (const key in values) {
		if (Object.hasOwn(values, key)) {
			const value = values[key];
			const schemaType = schemaShape[key];
			if (schemaType && schemaType._def.typeName === "ZodArray") {
				for (const item of value as unknown as any[]) {
					params.append(key, String(item));
				}
			} else {
				params.append(key, String(value));
			}
		}
	}

	return params;
}
