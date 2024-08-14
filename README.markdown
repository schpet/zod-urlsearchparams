# zod urlsearchparams

convert an object to a URLSearchParam based on its zod schema and vice versa.

- minimal urls, scalars are readable and editable by humans
- vectors are encoded with base64
- allows gracefully falling back to defaults with `lenientParse` 
- zero dependencies outside of zod

[introductory blog post](https://schpet.com/note/building-a-typescript-library-with-aider) explaining how this library was built with [aider](https://aider.chat/).

## install

```bash
npm i zod-urlsearchparams
pnpm i zod-urlsearchparams
yarn add zod-urlsearchparams
ni zod-urlsearchparams
```

## usage

### basic

```ts
import { z } from "zod";
import { lenientParse, parse, serialize } from "zod-urlsearchparams";

let schema = z.object({
  age: z.bigint(),
  species: z.enum(["dog", "cat"]),
  interests: z.array(z.string()),
  location: z.object({
    room: z.string(),
  }),
});

let serialized = serialize({
  schema,
  data: {
    age: BigInt(5),
    species: "dog",
    interests: ["sleeping", "sniffing"],
    location: {
      room: "kitchen",
    },
  },
});
console.log(serialized.toString());
// age=5&species=dog&interests=sleeping&interests=sniffing&location=eyJyb29tIjoia2l0Y2hlbiJ9

let strictParsed = parse({
  schema,
  input: new URLSearchParams(
    "age=10&species=cat&interests=sleeping&interests=sniffing&location=eyJyb29tIjoiY2F0aW8ifQ"
  ),
});
console.log(strictParsed);
// {
//   age: 10n,
//   species: 'cat',
//   interests: [ 'sleeping', 'sniffing' ],
//   location: { room: 'catio' }
// }

let lenientParsed = lenientParse({
  schema,
  input: new URLSearchParams("age=10&species=cat"),
  defaultData: {
    age: BigInt(0),
    species: "dog",
    interests: [],
    location: { room: "kitchen" },
  },
});
console.log(lenientParsed);
// {
//   age: 10n,
//   species: 'cat',
//   interests: [],
//   location: { room: 'kitchen' }
// }
```

### class based api

```ts
import { ZodURLSearchParamSerializer } from "zod-urlsearchparams";

let serializer = new ZodURLSearchParamSerializer(schema);

let serializedBySerializer = serializer.serialize({
  age: BigInt(5),
  species: "dog",
  interests: ["sleeping", "sniffing"],
  location: {
    room: "kitchen",
  },
});
console.log(serializedBySerializer.toString());
// age=5&species=dog&interests=sleeping&interests=sniffing&location=eyJyb29tIjoia2l0Y2hlbiJ9

let parsedBySerializer = serializer.lenientParse(
  new URLSearchParams(
    "age=10&species=cat&interests=sleeping&interests=sniffing&location=eyJyb29tIjoiY2F0aW8ifQ"
  ),
  {
    age: BigInt(0),
    species: "dog",
    interests: [],
    location: { room: "kitchen" },
  }
);
console.log(parsedBySerializer);
// {
//   age: 10n,
//   species: 'cat',
//   interests: [ 'sleeping', 'sniffing' ],
//   location: { room: 'catio' }
// }
```
