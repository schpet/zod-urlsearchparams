import { assert, test } from "vitest";
import { z } from "zod";
import { parse, serialize } from "../src";

test("serialize basic object", () => {
	const schema = z.object({
		a: z.string(),
		b: z.string(),
	});

	const values = { a: "one", b: "two" };
	const expected = new URLSearchParams({ a: "one", b: "two" });

	const result = serialize(schema, values);

	assert.equal(result.toString(), expected.toString());
});

test("parse URLSearchParams to object", () => {
	const schema = z.object({
		a: z.string(),
		b: z.string(),
	});

	const input = new URLSearchParams({ a: "one", b: "two" });
	const expected = { a: "one", b: "two" };

	const result = parse(schema, input);

	assert.deepEqual(result, expected);
});
