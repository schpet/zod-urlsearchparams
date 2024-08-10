import {
	ZodArray,
	type ZodObject,
	type ZodTypeAny,
	z,
	type infer as zodInfer,
} from "zod";

type Schema = ZodObject<Record<string, ZodTypeAny>>;

const booleanToString = z.boolean().transform((val) => (val ? "t" : "f"));
const numberToString = z.number().transform((val) => val.toString());
const otherToString = z.unknown().transform((val) => btoa(JSON.stringify(val)));

const stringToBoolean = z
	.string()
	.transform((val) => val === "t" || val === "true");
const stringToNumber = z.string().transform((val) => {
	const num = Number(val);
	if (Number.isNaN(num)) {
		throw new Error("Invalid number");
	}
	return num;
});
const stringToOther = z.string().transform((val) => JSON.parse(atob(val)));

function parseValue(value: string, schemaType: ZodTypeAny): unknown {
	if (schemaType instanceof z.ZodNumber) {
		return stringToNumber.parse(value);
	}
	if (schemaType instanceof z.ZodBoolean) {
		return stringToBoolean.parse(value);
	}
	if (schemaType instanceof z.ZodString) {
		return value;
	}
	return stringToOther.parse(value);
}

function serializeValue(value: unknown, schemaType: ZodTypeAny): string {
	if (schemaType instanceof z.ZodNumber) {
		return numberToString.parse(value);
	}
	if (schemaType instanceof z.ZodBoolean) {
		return booleanToString.parse(value);
	}
	if (schemaType instanceof z.ZodString) {
		return String(value);
	}
	return otherToString.parse(value);
}

export function parse<T extends Schema>({
	schema,
	input,
}: {
	schema: T;
	input: URLSearchParams;
}): zodInfer<T> {
	let obj: Record<string, unknown> = {};
	let schemaShape = schema.shape;
	for (let key in schemaShape) {
		let values = input.getAll(key);
		let schemaType = schemaShape[key];
		if (schemaType instanceof ZodArray) {
			obj[key] = values.map((value) => parseValue(value, schemaType.element));
		} else if (values.length > 0) {
			let value = values[values.length - 1];
			obj[key] = parseValue(value, schemaType);
		}
	}
	return schema.parse(obj);
}

export function serialize<T extends Schema>({
	schema,
	data,
	defaultValues,
}: {
	schema: T;
	data: zodInfer<T>;
	defaultValues?: Partial<zodInfer<T>>;
}): URLSearchParams {
	let params = new URLSearchParams();

	let schemaShape = schema.shape;
	for (let key in data) {
		if (Object.hasOwn(data, key)) {
			let value = data[key];
			let schemaType = schemaShape[key];
			if (schemaType instanceof ZodArray) {
				for (let item of value as unknown[]) {
					params.append(key, serializeValue(item, schemaType.element));
				}
			} else {
				params.append(key, serializeValue(value, schemaType));
			}
		}
	}

	return params;
}
