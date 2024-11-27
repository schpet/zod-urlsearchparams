import { assert, describe, expect, test } from "vitest"
import { ZodError, z } from "zod"
import { ZodURLSearchParamSerializer, lenientParse, parse, safeParse, serialize } from "../src"

test("serialize basic object", () => {
	const schema = z.object({
		a: z.string(),
		b: z.string(),
	})

	const values = { a: "one", b: "two" }
	const expected = new URLSearchParams({ a: "one", b: "two" })

	const result = serialize({ schema, data: values })

	assert.equal(result.toString(), expected.toString())
})

test("parse URLSearchParams to object with numbers and booleans", () => {
	const schema = z.object({
		count: z.number(),
		isActive: z.boolean(),
	})

	const input = new URLSearchParams({ count: "42", isActive: "true" })
	const expected = { count: 42, isActive: true }

	const result = parse({ schema, input })

	assert.deepEqual(result, expected)
})

test("ZodURLSearchParamSerializer lenientParse with invalid enum value", () => {
	const schema = z.object({
		status: z.enum(["active", "inactive"]),
		role: z.enum(["admin", "user", "guest"]),
		age: z.number(),
		name: z.string(),
	})

	const serializer = new ZodURLSearchParamSerializer(schema)

	const input = new URLSearchParams({
		status: "invalid_status",
		role: "admin",
		age: "not a number",
		name: "John Doe",
	})

	const defaultData = {
		status: "inactive" as const,
		role: "guest" as const,
		age: 0,
		name: "Default Name",
	}

	const result = serializer.lenientParse(input, defaultData)

	assert.deepEqual(result, {
		status: "inactive",
		role: "admin",
		age: 0,
		name: "John Doe",
	})
	assert.equal(result.status, defaultData.status, "The 'status' field should use the default value")
	assert.equal(result.age, defaultData.age, "The 'age' field should use the default value")
	assert.notEqual(result.name, defaultData.name, "The 'name' field should use the input value")
})

test("serialize object with array of enums", () => {
	const schema = z.object({
		statuses: z.array(z.enum(["PUBLISHED", "UNPUBLISHED"])),
	})

	const values = schema.parse({ statuses: ["PUBLISHED", "UNPUBLISHED"] })
	const expected = new URLSearchParams()
	expected.append("statuses", "PUBLISHED")
	expected.append("statuses", "UNPUBLISHED")

	const result = serialize({ schema, data: values })

	assert.equal(result.toString(), "statuses=PUBLISHED&statuses=UNPUBLISHED")
})

test("serialize and deserialize object with array of objects", () => {
	const schema = z.object({
		statuses: z.array(z.object({ label: z.string() })),
	})

	const originalData = { statuses: [{ label: "a" }, { label: "b" }] }
	const serialized = serialize({ schema, data: originalData })
	const deserialized = parse({ schema, input: serialized })

	assert.deepEqual(deserialized, originalData)
})

test("parse URLSearchParams with defaultData and omitted fields", () => {
	const schema = z.object({
		name: z.string(),
		age: z.number(),
		isStudent: z.boolean(),
	})

	const defaultData = {
		name: "John Doe",
		age: 30,
		isStudent: false,
	}

	const input = new URLSearchParams({ name: "Jane Doe" })

	const expected = {
		name: "Jane Doe",
		age: 30,
		isStudent: false,
	}

	const result = parse({ schema, input, defaultData })

	assert.deepEqual(result, expected)
	assert.notEqual(result.name, defaultData.name, "Name should be from input, not default")
	assert.equal(result.age, defaultData.age, "Age should be from default")
	assert.equal(result.isStudent, defaultData.isStudent, "isStudent should be from default")
})

test("serialize object with default data", () => {
	const schema = z.object({
		name: z.string(),
		age: z.number(),
		isStudent: z.boolean(),
	})

	const defaultData = {
		name: "John Doe",
		age: 30,
		isStudent: false,
	}

	const values = {
		name: "Jane Doe",
		age: 30, // Same as default
		isStudent: true,
	}

	const result = serialize({ schema, data: values, defaultData })

	const expected = new URLSearchParams()
	expected.append("name", "Jane Doe")
	expected.append("isStudent", "t")

	assert.equal(result.toString(), expected.toString())
	assert.equal(result.has("age"), false, "Age should not be included in the result")
})

test("ZodURLSearchParamSerializer serializes and deserializes simple object", () => {
	const schema = z.object({
		name: z.string(),
		age: z.number(),
		isStudent: z.boolean(),
	})

	const serializer = new ZodURLSearchParamSerializer(schema)

	const originalData = {
		name: "John Doe",
		age: 30,
		isStudent: false,
	}

	const serialized = serializer.serialize(originalData)
	const deserialized = serializer.parse(serialized)

	assert.deepEqual(deserialized, originalData)
})

test("ZodURLSearchParamSerializer safeParse with valid and invalid input", () => {
	const schema = z.object({
		age: z.number(),
		name: z.string(),
	})

	const serializer = new ZodURLSearchParamSerializer(schema)

	const validInput = new URLSearchParams({ age: "30", name: "John" })
	const invalidInput = new URLSearchParams({ age: "not a number", name: "John" })

	const validResult = serializer.safeParse(validInput)
	const invalidResult = serializer.safeParse(invalidInput)

	assert.isTrue(validResult.success)
	if (validResult.success) {
		assert.deepEqual(validResult.data, { age: 30, name: "John" })
	}

	assert.isFalse(invalidResult.success)
	if (!invalidResult.success) {
		assert.isTrue(Array.isArray(invalidResult.error.errors))
		assert.isTrue(invalidResult.error.errors.length > 0)
		assert.equal(invalidResult.error.errors[0].code, "invalid_type")
	}
})

test("serialize and parse object with BigInt", () => {
	const schema = z.object({
		id: z.bigint(),
		name: z.string(),
	})

	const originalData = { id: BigInt("9007199254740991"), name: "Large Number" }
	const serialized = serialize({ schema, data: originalData })
	const parsed = parse({ schema, input: serialized })

	assert.deepEqual(parsed, originalData)
	assert.strictEqual(typeof parsed.id, "bigint")
	assert.strictEqual(parsed.id.toString(), "9007199254740991")
})

test("serialize and parse object with Date", () => {
	const schema = z.object({
		createdAt: z.date(),
		name: z.string(),
	})

	const originalData = { createdAt: new Date("2023-06-15T12:00:00Z"), name: "Test Date" }
	const serialized = serialize({ schema, data: originalData })
	const parsed = parse({ schema, input: serialized })

	assert.deepEqual(parsed, originalData)
	assert.strictEqual(parsed.createdAt instanceof Date, true)
	assert.strictEqual(parsed.createdAt.toISOString(), "2023-06-15T12:00:00.000Z")
})

test("serialize and parse nested object with emoji", () => {
	const schema = z.object({
		p: z.object({
			c: z.string(),
		}),
	})

	const originalData = { p: { c: "Hello, 🌍!" } }
	const serialized = serialize({ schema, data: originalData })
	const parsed = parse({ schema, input: serialized })

	assert.deepEqual(parsed, originalData)
	assert.strictEqual(parsed.p.c, "Hello, 🌍!")
})

test("serialize a nested object", () => {
	const schema = z.object({
		user: z.object({
			name: z.string(),
		}),
	})

	const data = {
		user: {
			name: "John Doe",
		},
	}

	const serialized = serialize({ schema, data })
	expect(serialized.toString()).toMatchInlineSnapshot(`"user=eyJuYW1lIjoiSm9obiBEb2UifQ"`)
})

test("parse a nested object", () => {
	const schema = z.object({
		user: z.object({
			name: z.string(),
		}),
	})
	let result = parse({ schema, input: new URLSearchParams("user=eyJuYW1lIjoiSm9obiBEb2UifQ") })
	expect(result.user.name).toBe("John Doe")
})

test("parse a nested object with invalid json", () => {
	const schema = z.object({
		user: z.object({
			name: z.string(),
		}),
	})

	expect(() => parse({ schema, input: new URLSearchParams("user=nope") })).toThrow(z.ZodError)
})

test("lenientParse a nested object with invalid json", () => {
	const schema = z.object({
		user: z.object({
			name: z.string(),
		}),
	})

	const defaultData = {
		user: {
			name: "Default Name",
		},
	}

	const result = lenientParse({ schema, input: new URLSearchParams("user=nope"), defaultData })

	expect(result).toEqual(defaultData)
})

test("safeParse with valid and invalid input", () => {
	const schema = z.object({
		age: z.number(),
		name: z.string(),
	})

	const validInput = new URLSearchParams({ age: "30", name: "John" })
	const invalidInput = new URLSearchParams({ age: "not a number", name: "John" })

	const validResult = safeParse({ schema, input: validInput })
	const invalidResult = safeParse({ schema, input: invalidInput })

	assert.isTrue(validResult.success)
	if (validResult.success) {
		assert.deepEqual(validResult.data, { age: 30, name: "John" })
	}

	assert.isFalse(invalidResult.success)
	if (!invalidResult.success) {
		assert.isTrue(Array.isArray(invalidResult.error.errors))
		assert.isTrue(invalidResult.error.errors.length > 0)
		assert.equal(invalidResult.error.errors[0].code, "invalid_type")
	}
})

test("serialize and parse object with native enum", () => {
	enum Color {
		Red = "RED",
		Green = "GREEN",
		Blue = "BLUE",
	}

	const schema = z.object({
		color: z.nativeEnum(Color),
	})

	const originalData = { color: Color.Green }
	const serialized = serialize({ schema, data: originalData })
	const parsed = parse({ schema, input: serialized })

	assert.deepEqual(parsed, originalData)
	assert.strictEqual(parsed.color, Color.Green)
	assert.strictEqual(serialized.get("color"), "GREEN")
})

test("serialize and parse object with Zod literal", () => {
	const schema = z.object({
		status: z.literal("active"),
		type: z.literal("user"),
	})

	const originalData = { status: "active" as const, type: "user" as const }
	const serialized = serialize({ schema, data: originalData })
	const parsed = parse({ schema, input: serialized })

	assert.deepEqual(parsed, originalData)
	assert.strictEqual(serialized.get("status"), "active")
	assert.strictEqual(serialized.get("type"), "user")
})

test("serialize and parse object with Zod union of literals", () => {
	const schema = z.object({
		status: z.union([z.literal("active"), z.literal("inactive")]),
		role: z.union([z.literal("admin"), z.literal("user"), z.literal("guest")]),
	})

	const originalData = { status: "inactive" as const, role: "admin" as const }
	const serialized = serialize({ schema, data: originalData })
	const parsed = parse({ schema, input: serialized })

	assert.deepEqual(parsed, originalData)
	assert.strictEqual(serialized.get("status"), "inactive")
	assert.strictEqual(serialized.get("role"), "admin")

	// Test with different values
	const anotherData = { status: "active" as const, role: "guest" as const }
	const anotherSerialized = serialize({ schema, data: anotherData })
	const anotherParsed = parse({ schema, input: anotherSerialized })

	assert.deepEqual(anotherParsed, anotherData)
	assert.strictEqual(anotherSerialized.get("status"), "active")
	assert.strictEqual(anotherSerialized.get("role"), "guest")
})

test("lenientParse with invalid enum value", () => {
	const schema = z.object({
		a: z.enum(["A1", "A2", "A3"]),
		b: z.enum(["B1", "B2", "B3"]),
		c: z.number(),
		d: z.string(),
	})

	const input = new URLSearchParams({
		a: "A1",
		b: "InvalidB",
		c: "not a number",
		d: "valid string",
	})

	const defaultData = {
		a: "A2" as const,
		b: "B1" as const,
		c: 0,
		d: "default string",
	}

	const result = lenientParse({ schema, input, defaultData })

	assert.deepEqual(result, { a: "A1", b: "B1", c: 0, d: "valid string" })
	assert.equal(result.b, defaultData.b, "The 'b' field should use the default value")
	assert.equal(result.c, defaultData.c, "The 'c' field should use the default value")
})

test("serialize object with numbers and booleans", () => {
	const schema = z.object({
		count: z.number(),
		isActive: z.boolean(),
	})

	const values = { count: 42, isActive: true }
	const expected = new URLSearchParams({ count: "42", isActive: "t" })

	const result = serialize({ schema, data: values })

	assert.equal(result.toString(), expected.toString())
})

test("serialize object with array of strings", () => {
	const schema = z.object({
		tags: z.array(z.string()),
	})

	const values = { tags: ["tag1", "tag2", "tag3"] }
	const expected = new URLSearchParams()
	expected.append("tags", "tag1")
	expected.append("tags", "tag2")
	expected.append("tags", "tag3")

	const result = serialize({ schema, data: values })

	assert.equal(result.toString(), expected.toString())
	assert.equal(result.toString(), "tags=tag1&tags=tag2&tags=tag3")
})

test("parse URLSearchParams to object", () => {
	const schema = z.object({
		a: z.string(),
		b: z.string(),
	})

	const input = new URLSearchParams({ a: "one", b: "two" })
	const expected = { a: "one", b: "two" }

	const result = parse({ schema, input })

	assert.deepEqual(result, expected)
})

test("parse URLSearchParams with array of strings", () => {
	const schema = z.object({
		tags: z.array(z.string()),
	})

	const input = new URLSearchParams()
	input.append("tags", "tag1")
	input.append("tags", "tag2")
	input.append("tags", "tag3")

	const expected = { tags: ["tag1", "tag2", "tag3"] }

	const result = parse({ schema, input })

	assert.deepEqual(result, expected)
})

test("parse URLSearchParams with array of strings and array of numbers", () => {
	const schema = z.object({
		tags: z.array(z.string()),
		scores: z.array(z.number()),
	})

	const input = new URLSearchParams()
	input.append("tags", "tag1")
	input.append("tags", "tag2")
	input.append("tags", "tag3")
	input.append("scores", "10")
	input.append("scores", "20")
	input.append("scores", "30")

	const expected = {
		tags: ["tag1", "tag2", "tag3"],
		scores: [10, 20, 30],
	}

	const result = parse({ schema, input })

	assert.deepEqual(result, expected)
})

describe("with effects", () => {
	test.for([
		{
			name: "default",
			schema: z.object({
				a: z.string().default("hi"),
				b: z.number().default(1),
			}),
			input: new URLSearchParams(),
			expected: { a: "hi", b: 1 },
		},
		{
			name: "optional",
			schema: z.object({
				a: z.string().optional(),
				b: z.number().optional(),
			}),
			input: new URLSearchParams(),
			expected: {},
		},
		{
			name: "min",
			schema: z.object({
				a: z.string().min(1),
				b: z.number().min(1),
			}),
			input: new URLSearchParams("a=hi&b=1"),
			expected: { a: "hi", b: 1 },
		},
		{
			name: "min condition not met",
			schema: z.object({
				a: z.string().min(1),
				b: z.number().min(1),
			}),
			input: new URLSearchParams("a=&b=0"),
			expected: ZodError,
		},
		{
			name: "preprocessor",
			schema: z.object({
				a: z.preprocess(Number, z.number()),
			}),
			input: new URLSearchParams("a=1"),
			expected: { a: 1 },
		},
		{
			name: "post processor - transform number->number",
			schema: z.object({
				a: z.number().transform(Number),
			}),
			input: new URLSearchParams("a=1"),
			expected: { a: 1 },
		},
		{
			name: "post processor - transform string->number",
			schema: z.object({
				a: z.string().transform(Number),
			}),
			input: new URLSearchParams("a=1"),
			expected: { a: 1 },
		},
	])(`$name`, ({ schema, input, expected }, { expect }) => {
		if (expected instanceof Error || expected === Error || expected === ZodError) {
			expect(() => parse({ schema, input })).toThrow(expected as never)
		} else {
			let parsed = parse({ schema, input: new URLSearchParams(input) })
			expect(parsed).toEqual(expected)
			let urlSearchParams = serialize({ schema, data: parsed })
			expect(urlSearchParams).toEqual(input)
		}
	})
})
