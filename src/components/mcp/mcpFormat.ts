/** Best-effort extraction of the human-readable text from an MCP CallToolResult/GetPromptResult
 *  -- both shapes carry a `content`/`messages[].content` array of typed blocks, and most tool
 *  results are just a single text block worth surfacing above the raw JSON. */
export function extractMcpText(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const content = (result as { content?: unknown }).content;
  if (!Array.isArray(content)) return null;
  const texts = content
    .filter((block): block is { type: string; text: string } => {
      return !!block && typeof block === "object" && (block as { type?: unknown }).type === "text" && typeof (block as { text?: unknown }).text === "string";
    })
    .map((block) => block.text);
  return texts.length ? texts.join("\n") : null;
}

export function isMcpError(result: unknown): boolean {
  return !!result && typeof result === "object" && Boolean((result as { isError?: unknown }).isError);
}
