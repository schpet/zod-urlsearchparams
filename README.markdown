# zod urlsearchparams

A library for serializing and parsing URLSearchParams using Zod schemas.

## examples

### serializing

```ts
import assert from "node:assert"
import { z } from "zod"
import { ZodURLSearchParamSerializer } from "../dist"

// setup your schema
const schema = z.object({ name: z.string(), age: z.number(), hobbies: z.array(z.string()) })

// setup the serializer
const serializer = new ZodURLSearchParamSerializer(schema)

const data = { name: "John Doe", age: 30, hobbies: ["reading", "cycling"] }

// serialize it to url params, see how it looks–
const params = serializer.serialize(data)
assert.strictEqual(params.toString(), "name=John+Doe&age=30&hobbies=reading&hobbies=cycling")
```

### parsing

```ts
// sometimes people will visit a url that doesn't conform
const invalidParams = new URLSearchParams("name=Jane+Doe&age=invalid&hobbies=reading&hobbies=gardening")

// so we provide defaults to fall back to
const defaultData: z.infer<typeof schema> = {
	name: "Default Name",
	age: 25,
	hobbies: ["default hobby"],
}

// parse it :4)
const lenientResult = serializer.lenientParse(invalidParams, defaultData)

// it'll drop the invalid field and use the default value
assert.deepStrictEqual(lenientResult, {
	name: "Jane Doe",
	age: 25, // Uses default value because 'invalid' can't be parsed as a number
	hobbies: ["reading", "gardening"],
})
```
