const schema = require("mongodb-schema");
const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");
require("dotenv").config();

// Configuration
const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/";
const SAMPLE = process.env.MODE === "sample" ? true : false;
const VERBOSE = process.env.SCHEMA_VERBOSITY === "verbose" ? true : false;
const QUERY = process.env.QUERY
  ? EJSON.parse(process.env.QUERY, { relaxed: false })
  : {};
const CLIENT = new MongoClient(URI);
const DB_NAME = process.env.DB_NAME || "test";
const COLL_NAME = process.env.COLL_NAME || "test";

function* allFields(fieldArray) {
  for (const field of fieldArray) {
    yield field;
    for (const type of field.types || []) {
      if (type.fields) {
        yield* allFields(type.fields);
      }
    }
  }
}

// either read the entire collection or sample
// aggregation will get optimized to a simple find if not sampling
async function getCursor(coll) {
  let pipeline = [{ $match: QUERY }];
  if (SAMPLE) {
    const size = Math.min(
      Math.max(20, (await coll.estimatedDocumentCount()) * 0.04),
      10000
    );
    pipeline.push({ $sample: { size: Math.ceil(size) } });
  }
  return coll.aggregate(pipeline);
}

async function parseSchema(cursor) {
  const schemaStream = schema.stream({
    semanticTypes: true,
    verbose: VERBOSE,
  });
  let result;
  schemaStream.on("data", (data) => (result = data));

  let doc;
  while ((await (doc = cursor.tryNext())) !== null) {
    schemaStream.write(await doc);
  }
  schemaStream.end();
  return result;
}

function simplify(result) {
  const simplified = [];
  let maxFieldPathLength = 0;
  for (const field of allFields(result.fields)) {
    maxFieldPathLength = Math.max(maxFieldPathLength, field.path.length);
    const types = field.types || [{ name: field.type, probability: 1 }];
    for (const { probability, name } of types) {
      simplified.push([
        field.path,
        `${(probability * 100).toFixed(1)} %`,
        name,
      ]);
    }
  }
  for (const entry of simplified) {
    entry[0] = entry[0].padEnd(maxFieldPathLength);
  }
  return simplified;
}

async function main() {
  await CLIENT.connect();

  let coll = CLIENT.db(DB_NAME).collection(COLL_NAME);
  let cursor = await getCursor(coll);
  let result = await parseSchema(cursor);

  if (VERBOSE) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  let simplified = simplify(result);
  console.log(simplified);
}

main()
  .catch(console.error)
  .finally(() => CLIENT.close());
