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

	const result = serialize({ schema, values });

	assert.equal(result.toString(), expected.toString());
});

test("parse URLSearchParams to object with numbers and booleans", () => {
	const schema = z.object({
		count: z.number(),
		isActive: z.boolean(),
	});

	const input = new URLSearchParams({ count: "42", isActive: "true" });
	const expected = { count: 42, isActive: true };

	const result = parse({ schema, input });

	assert.deepEqual(result, expected);
});

test("serialize object with numbers and booleans", () => {
	const schema = z.object({
		count: z.number(),
		isActive: z.boolean(),
	});

	const values = { count: 42, isActive: true };
	const expected = new URLSearchParams({ count: "42", isActive: "true" });

	const result = serialize({ schema, values });

	assert.equal(result.toString(), expected.toString());
});

test("serialize object with array of strings", () => {
	const schema = z.object({
		tags: z.array(z.string()),
	});

	const values = { tags: ["tag1", "tag2", "tag3"] };
	const expected = new URLSearchParams();
	expected.append("tags", "tag1");
	expected.append("tags", "tag2");
	expected.append("tags", "tag3");

	const result = serialize({ schema, values });

	assert.equal(result.toString(), expected.toString());
});

test("parse URLSearchParams to object", () => {
	const schema = z.object({
		a: z.string(),
		b: z.string(),
	});

	const input = new URLSearchParams({ a: "one", b: "two" });
	const expected = { a: "one", b: "two" };

	const result = parse({ schema, input });

	assert.deepEqual(result, expected);
});
