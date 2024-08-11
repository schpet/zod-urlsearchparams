import { z } from "zod"
import { ZodURLSearchParamSerializer } from "zod-urlsearchparams"

// Define your schema
const schema = z.object({
	name: z.string(),
	age: z.number(),
	hobbies: z.array(z.string()),
})

// Create a serializer
const serializer = new ZodURLSearchParamSerializer(schema)

// Data to serialize
const data = {
	name: "John Doe",
	age: 30,
	hobbies: ["reading", "cycling"],
}

// Serialize the data
const params = serializer.serialize(data)

console.log(params.toString())
// Output: name=John%20Doe&age=30&hobbies=reading&hobbies=cycling
