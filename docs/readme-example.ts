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
