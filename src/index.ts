import { ZodArray, type ZodObject, type ZodTypeAny, z, type infer as zodInfer } from "zod"

type Schema = ZodObject<Record<string, ZodTypeAny>>

type ParseArgs<T extends Schema> = {
	schema: T
	input: URLSearchParams
	defaultData?: Partial<zodInfer<T>>
}

type SerializeArgs<T extends Schema> = {
	schema: T
	data: zodInfer<T>
	defaultData?: Partial<zodInfer<T>>
}

type ZodURLSearchParamSerializerParseArgs = Exclude<ParseArgs<Schema>, "schema">
type ZodURLSearchParamSerializerSerializeArgs<T> = Exclude<
	SerializeArgs<Schema>,
	"schema" | "defaultData"
> & { data: T }

const booleanToString = z.boolean().transform((val) => (val ? "t" : "f"))
const numberToString = z.number().transform((val) => val.toString())
const dateToString = z.date().transform((val) => val.toISOString())
const bigIntToString = z.bigint().transform((val) => val.toString())
const utf8ToBase64 = (str: string): string => {
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
			String.fromCharCode(Number.parseInt(p1, 16)),
		),
	).replace(/=+$/, "")
}

const base64ToUtf8 = (str: string): string => {
	// Add padding if necessary
	str = str.padEnd(str.length + ((4 - (str.length % 4)) % 4), "=")
	return decodeURIComponent(
		atob(str)
			.split("")
			.map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
			.join(""),
	)
}

const otherToString = z.unknown().transform((val) => utf8ToBase64(JSON.stringify(val)))

const stringToBoolean = z.string().transform((val) => val === "t" || val === "true")
const stringToNumber = z.string().transform((val) => {
	const num = Number(val)
	if (Number.isNaN(num)) {
		throw new Error("Invalid number")
	}
	return num
})
const stringToDate = z.string().transform((val) => new Date(val))
const stringToBigInt = z.string().transform((val) => BigInt(val))
const stringToOther = z.string().transform((val) => JSON.parse(base64ToUtf8(val)))

function parseValue(value: string, schemaType: ZodTypeAny): unknown {
	if (schemaType instanceof z.ZodNumber) {
		return stringToNumber.parse(value)
	}
	if (schemaType instanceof z.ZodBoolean) {
		return stringToBoolean.parse(value)
	}
	if (schemaType instanceof z.ZodString) {
		return value
	}
	if (schemaType instanceof z.ZodDate) {
		return stringToDate.parse(value)
	}
	if (schemaType instanceof z.ZodBigInt) {
		return stringToBigInt.parse(value)
	}
	return stringToOther.parse(value)
}

function serializeValue(value: unknown, schemaType: ZodTypeAny): string {
	if (schemaType instanceof z.ZodNumber) {
		return numberToString.parse(value)
	}
	if (schemaType instanceof z.ZodBoolean) {
		return booleanToString.parse(value)
	}
	if (schemaType instanceof z.ZodString) {
		return String(value)
	}
	if (schemaType instanceof z.ZodDate) {
		return dateToString.parse(value)
	}
	if (schemaType instanceof z.ZodBigInt) {
		return bigIntToString.parse(value)
	}
	return otherToString.parse(value)
}

function parse<T extends Schema>({ schema, input, defaultData }: ParseArgs<T>): zodInfer<T> {
	let obj: Record<string, unknown> = {}
	let schemaShape = schema.shape
	for (let key in schemaShape) {
		let values = input.getAll(key)
		let schemaType = schemaShape[key]
		if (schemaType instanceof ZodArray) {
			obj[key] = values.map((value) => parseValue(value, schemaType.element))
		} else if (values.length > 0) {
			let value = values[values.length - 1]
			obj[key] = parseValue(value, schemaType)
		}
	}
	return schema.parse(obj)
}

function serialize<T extends Schema>({
	schema,
	data,
	defaultData,
}: SerializeArgs<T>): URLSearchParams {
	let params = new URLSearchParams()

	let schemaShape = schema.shape
	for (let key in data) {
		if (Object.hasOwn(data, key)) {
			let value = data[key]
			let schemaType = schemaShape[key]
			if (schemaType instanceof ZodArray) {
				for (let item of value as unknown[]) {
					params.append(key, serializeValue(item, schemaType.element))
				}
			} else {
				params.append(key, serializeValue(value, schemaType))
			}
		}
	}

	return params
}

class ZodURLSearchParamSerializer<T extends Schema> {
	constructor(
		private schema: T,
		private defaultData?: Partial<zodInfer<T>>,
	) {}

	serialize(args: ZodURLSearchParamSerializerSerializeArgs<zodInfer<T>>): URLSearchParams {
		return serialize({
			...args,
			schema: this.schema,
			defaultData: this.defaultData,
		})
	}

	deserialize(args: ZodURLSearchParamSerializerParseArgs): zodInfer<T> {
		return parse({
			...args,
			schema: this.schema,
			defaultData: this.defaultData,
		})
	}
}

export {
	ZodURLSearchParamSerializer,
	parse,
	serialize,
	type ParseArgs,
	type SerializeArgs,
	type ZodURLSearchParamSerializerParseArgs,
	type ZodURLSearchParamSerializerSerializeArgs,
}
