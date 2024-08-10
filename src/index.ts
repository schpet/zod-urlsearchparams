import { ZodArray, type ZodObject, type ZodTypeAny, z, type infer as zodInfer } from "zod"

type Schema = ZodObject<Record<string, ZodTypeAny>>

export function parse<T extends Schema>({
	schema,
	input,
}: {
	schema: T
	input: URLSearchParams
}): zodInfer<T> {
	const obj: Record<string, unknown> = {}
	const schemaShape = schema.shape
	for (const [key, value] of input.entries()) {
		const schemaType = schemaShape[key]
		if (schemaType instanceof ZodArray) {
			obj[key] = value.split(",").map((item) => item.trim())
		} else if (schemaType instanceof z.ZodNumber) {
			obj[key] = Number(value)
		} else if (schemaType instanceof z.ZodBoolean) {
			obj[key] = value === "true"
		} else {
			obj[key] = value
		}
	}
	return schema.parse(obj)
}

export function serialize<T extends Schema>({
	schema,
	values,
	defaultValues,
}: {
	schema: T
	values: zodInfer<T>
	defaultValues?: Partial<zodInfer<T>>
}): URLSearchParams {
	const params = new URLSearchParams()

	const schemaShape = schema.shape
	for (let key in values) {
		if (Object.hasOwn(values, key)) {
			const value = values[key]
			const schemaType = schemaShape[key]
			if (schemaType instanceof ZodArray) {
				for (const item of value as unknown[]) {
					params.append(key, String(item))
				}
			} else if (
				schemaType instanceof z.ZodString ||
				schemaType instanceof z.ZodNumber ||
				schemaType instanceof z.ZodBoolean
			) {
				params.append(key, String(value))
			} else {
				const encodedValue = btoa(JSON.stringify(value))
				params.append(key, encodedValue)
			}
		}
	}

	return params
}
