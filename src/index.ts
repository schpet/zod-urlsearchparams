import {
	ZodArray,
	type ZodObject,
	type ZodTypeAny,
	z,
	type infer as zodInfer,
} from "zod";

type Schema = ZodObject<Record<string, ZodTypeAny>>;

const booleanToString = z.boolean().transform((val) => val ? 't' : 'f');

export function parse<T extends Schema>({
	schema,
	input,
}: {
	schema: T;
	input: URLSearchParams;
}): zodInfer<T> {
	let obj: Record<string, unknown> = {};
	let schemaShape = schema.shape;
	for (let [key, value] of input.entries()) {
		let schemaType = schemaShape[key];
		if (schemaType instanceof ZodArray) {
			obj[key] = value.split(",").map((item) => item.trim());
		} else if (schemaType instanceof z.ZodNumber) {
			obj[key] = Number(value);
		} else if (schemaType instanceof z.ZodBoolean) {
			obj[key] = value === "true";
		} else {
			obj[key] = value;
		}
	}
	return schema.parse(obj);
}

export function serialize<T extends Schema>({
	schema,
	values,
	defaultValues,
}: {
	schema: T;
	values: zodInfer<T>;
	defaultValues?: Partial<zodInfer<T>>;
}): URLSearchParams {
	let params = new URLSearchParams();

	let schemaShape = schema.shape;
	for (let key in values) {
		if (Object.hasOwn(values, key)) {
			let value = values[key];
			let schemaType = schemaShape[key];
			if (schemaType instanceof ZodArray) {
				for (let item of value as unknown[]) {
					params.append(key, String(item));
				}
			} else if (
				schemaType instanceof z.ZodString ||
				schemaType instanceof z.ZodNumber
			) {
				params.append(key, String(value));
			} else if (schemaType instanceof z.ZodBoolean) {
				params.append(key, booleanToString.parse(value));
			} else {
				let encodedValue = btoa(JSON.stringify(value));
				params.append(key, encodedValue);
			}
		}
	}

	return params;
}
