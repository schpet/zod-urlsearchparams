import { assert, test } from "vitest"
import { z } from "zod"
import { ZodURLSearchParamSerializer, parse, serialize } from "../src"

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

	const serialized = serializer.serialize({ data: originalData })
	const deserialized = serializer.deserialize({ input: serialized })

	assert.deepEqual(deserialized, originalData)
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
