# analyze-schema-nodejs
very similar code to the [mongosh snippet for analyze-schema](https://github.com/mongodb-labs/mongosh-snippets/tree/main/snippets/analyze-schema); however, this version extracts the core logic to a nodejs script that is more easily extensible for programatic use.

# usage
`[pnpm | yarn | npm] install`

`node schema.js`

# configuration
to change parameters, create a `.env` file with the desired override values

## sample .env file
the following .env file has all possible options with all values changed from their defaults
```
MONGODB_URI="mongodb+srv://username:password@cluster.ab1cd.mongodb.net"
DB_NAME="sampleDatabase"
COLL_NAME="sampleCollection"
SCHEMA_VERBOSITY="verbose"
QUERY="{"_id": { "$oid": "63a0c333050078dac810fae0"}}"
MODE="sample"
```

## options
All current possible configuration options are listed below.

### MONGODB_URI
connection string to connect to for schema analysis

*(default: "mongodb://localhost:27017/")*

### DB_NAME
mongodb database to select

*(default: "test")*

### COLL_NAME
mongodb collection to select

*(default: "test")*

### SCHEMA_VERBOSITY
verbosity level to return the results. Currently supported verbosities are:
  * `"verbose"`: returns more information in JSON format
  * all other values will be ignored

*(default: unset - simplified output)*

### QUERY
filter that limits the schema analysis on the server only for documents that match. Formatting must adhere to strict [extended JSON v2 format](https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/).

*(default: unset - no filter)*

### MODE
mode to preform the schema analysis. Currently supported modes are:
  * `"sample"`: samples documents in the collection instead of full scan
  * all other values will be ignored

*(default: unset - analyze full collection)*
