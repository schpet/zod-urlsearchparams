import { ZodArray, type ZodObject, type ZodTypeAny, z, type infer as zodInfer } from "zod"

type Schema = ZodObject<Record<string, ZodTypeAny>>

const booleanToString = z.boolean().transform((val) => (val ? "t" : "f"))
const numberToString = z.number().transform((val) => val.toString())
const otherToString = z.unknown().transform((val) => btoa(JSON.stringify(val)))

const stringToBoolean = z.string().transform((val) => val === "t" || val === "true")
const stringToNumber = z.string().transform((val) => {
	const num = Number(val)
	if (Number.isNaN(num)) {
		throw new Error("Invalid number")
	}
	return num
})
const stringToOther = z.string().transform((val) => JSON.parse(atob(val)))

export function parse<T extends Schema>({
	schema,
	input,
}: {
	schema: T
	input: URLSearchParams
}): zodInfer<T> {
	let obj: Record<string, unknown> = {}
	let schemaShape = schema.shape
	for (let key in schemaShape) {
		let values = input.getAll(key)
		let schemaType = schemaShape[key]
		if (schemaType instanceof ZodArray) {
			obj[key] = values
		} else if (values.length > 0) {
			let value = values[values.length - 1]
			if (schemaType instanceof z.ZodNumber) {
				obj[key] = stringToNumber.parse(value)
			} else if (schemaType instanceof z.ZodBoolean) {
				obj[key] = stringToBoolean.parse(value)
			} else if (schemaType instanceof z.ZodString) {
				obj[key] = value
			} else {
				obj[key] = stringToOther.parse(value)
			}
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
	let params = new URLSearchParams()

	let schemaShape = schema.shape
	for (let key in values) {
		if (Object.hasOwn(values, key)) {
			let value = values[key]
			let schemaType = schemaShape[key]
			if (schemaType instanceof ZodArray) {
				for (let item of value as unknown[]) {
					params.append(key, String(item))
				}
			} else if (schemaType instanceof z.ZodString) {
				params.append(key, String(value))
			} else if (schemaType instanceof z.ZodNumber) {
				params.append(key, numberToString.parse(value))
			} else if (schemaType instanceof z.ZodBoolean) {
				params.append(key, booleanToString.parse(value))
			} else {
				params.append(key, otherToString.parse(value))
			}
		}
	}

	return params
}
