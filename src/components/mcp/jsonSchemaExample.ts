/** A plain JSON Schema node, narrowed to the fields this generator reads. MCP tool input
 *  schemas are draft-07-ish JSON Schema; this covers what tools actually use in practice. */
interface JsonSchemaNode {
  type?: string | string[];
  properties?: Record<string, JsonSchemaNode>;
  items?: JsonSchemaNode;
  enum?: unknown[];
  default?: unknown;
  examples?: unknown[];
  description?: string;
  minimum?: number;
}

function isSchemaNode(value: unknown): value is JsonSchemaNode {
  return !!value && typeof value === "object";
}

/** Builds one self-documenting example value for a schema node. Strings become
 *  `"<the field's description>"` so a person with no schema-reading experience can see what
 *  goes there directly in the value, without cross-referencing the schema shown alongside it. */
function exampleForNode(schema: JsonSchemaNode): unknown {
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case "string":
      return `<${schema.description ?? "value"}>`;
    case "number":
    case "integer":
      return schema.minimum ?? 0;
    case "boolean":
      return false;
    case "array":
      return isSchemaNode(schema.items) ? [exampleForNode(schema.items)] : [];
    case "object":
      return exampleForObject(schema);
    default:
      // No explicit "type" -- still treat it as an object if it has properties (some MCP
      // servers omit "type": "object" on the root schema), otherwise fall back to a string.
      return schema.properties ? exampleForObject(schema) : `<${schema.description ?? "value"}>`;
  }
}

function exampleForObject(schema: JsonSchemaNode): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
    out[key] = isSchemaNode(propSchema) ? exampleForNode(propSchema) : null;
  }
  return out;
}

/** Turns a tool's inputSchema into a ready-to-edit example arguments object -- every property
 *  gets a placeholder value (its description, for strings) so a layman can fill in a tool call
 *  by editing what's already there instead of writing JSON from scratch. */
export function generateExampleToolArgs(inputSchema: unknown): Record<string, unknown> {
  if (!isSchemaNode(inputSchema)) return {};
  const example = exampleForNode(inputSchema);
  return example && typeof example === "object" && !Array.isArray(example) ? (example as Record<string, unknown>) : {};
}

interface McpPromptArgument {
  name?: string;
  description?: string;
  required?: boolean;
}

/** MCP prompt arguments are always flat name -> string pairs (see GetPromptRequest), described
 *  by an array of {name, description, required}. Same self-documenting-placeholder approach as
 *  tool args, adapted to that flat string-only shape. */
export function generateExamplePromptArgs(promptArguments: unknown): Record<string, string> {
  if (!Array.isArray(promptArguments)) return {};
  const out: Record<string, string> = {};
  for (const arg of promptArguments as McpPromptArgument[]) {
    if (!arg || typeof arg.name !== "string") continue;
    out[arg.name] = `<${arg.description ?? (arg.required ? "required value" : "optional value")}>`;
  }
  return out;
}
