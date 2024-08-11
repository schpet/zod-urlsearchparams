import assert from "node:assert"
import { z } from "zod"
import { ZodURLSearchParamSerializer } from "../dist"

const schema = z.object({
	name: z.string(),
	age: z.number(),
	hobbies: z.array(z.string()),
})

const serializer = new ZodURLSearchParamSerializer(schema)

const data = {
	name: "John Doe",
	age: 30,
	hobbies: ["reading", "cycling"],
}

const params = serializer.serialize(data)

assert.strictEqual(params.toString(), "name=John+Doe&age=30&hobbies=reading&hobbies=cycling")

// Example of lenientParse
const invalidParams = new URLSearchParams(
	"name=Jane+Doe&age=invalid&hobbies=reading&hobbies=gardening",
)
const defaultData = {
	name: "Default Name",
	age: 25,
	hobbies: ["default hobby"],
}

const lenientResult = serializer.lenientParse(invalidParams, defaultData)

assert.deepStrictEqual(lenientResult, {
	name: "Jane Doe",
	age: 25, // Uses default value because 'invalid' can't be parsed as a number
	hobbies: ["reading", "gardening"],
})
