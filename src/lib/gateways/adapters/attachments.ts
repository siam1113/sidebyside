import type { Attachment } from "../types";

/** Splits a `data:<mimeType>;base64,<data>` URI into its parts. Returns null if it's malformed. */
export function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

/** Renders a "file" or "text" attachment as inline text when it's plausibly text-shaped, so
 *  protocols with no generic-file content type can still fold it into the prompt. Returns null
 *  for attachments that aren't safely treated as text (e.g. a PDF or image). */
export function attachmentAsText(att: Attachment): string | null {
  if (att.kind === "text") return att.text ?? null;
  if (att.kind === "file" && /^text\/|^application\/json$/.test(att.mimeType)) {
    const parsed = att.dataUrl ? parseDataUrl(att.dataUrl) : null;
    if (!parsed) return null;
    try {
      return Buffer.from(parsed.base64, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }
  return null;
}

export function formatAttachmentForPrompt(att: Attachment): string {
  const text = attachmentAsText(att);
  return text ? `--- Attached: ${att.name} ---\n${text}\n--- End of ${att.name} ---` : "";
}

interface OpenAiImagePart {
  type: "image_url";
  image_url: { url: string };
}
interface OpenAiTextPart {
  type: "text";
  text: string;
}

/** Builds an OpenAI/Azure OpenAI chat.completions `content` value (string when there's nothing to
 *  attach, otherwise the multimodal array shape) plus any warnings for attachments that content
 *  type can't carry -- video has no chat.completions equivalent, and binary files with no text
 *  extraction fall back to a warning rather than silently dropping the attachment. */
export function buildOpenAiUserContent(
  prompt: string,
  attachments: Attachment[] | undefined,
): { content: string | Array<OpenAiTextPart | OpenAiImagePart>; warnings: string[] } {
  if (!attachments?.length) return { content: prompt, warnings: [] };

  const warnings: string[] = [];
  const imageParts: OpenAiImagePart[] = [];
  let textBody = prompt;

  for (const att of attachments) {
    if (att.kind === "image" && att.dataUrl) {
      imageParts.push({ type: "image_url", image_url: { url: att.dataUrl } });
      continue;
    }
    const asText = attachmentAsText(att);
    if (asText != null) {
      textBody += `\n\n${formatAttachmentForPrompt(att)}`;
      continue;
    }
    warnings.push(
      `Attachment "${att.name}" (${att.mimeType}) isn't supported by this protocol's chat API and was left out of the request -- only images and text-like files can be inlined here.`,
    );
  }

  if (imageParts.length === 0) return { content: textBody, warnings };
  return { content: [{ type: "text", text: textBody }, ...imageParts], warnings };
}

const ANTHROPIC_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

interface AnthropicBlock {
  type: "text" | "image" | "document";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
}

/** Builds an Anthropic Messages API content-block array. Anthropic accepts base64 images
 *  (jpeg/png/gif/webp) via `image` blocks and PDFs via `document` blocks; it has no video input
 *  at all, so video attachments -- and any other binary type -- are warned about and left out. */
export function buildAnthropicUserContent(
  prompt: string,
  attachments: Attachment[] | undefined,
): { content: string | AnthropicBlock[]; warnings: string[] } {
  if (!attachments?.length) return { content: prompt, warnings: [] };

  const warnings: string[] = [];
  const mediaBlocks: AnthropicBlock[] = [];
  let textBody = prompt;

  for (const att of attachments) {
    const parsed = att.dataUrl ? parseDataUrl(att.dataUrl) : null;
    if (att.kind === "image" && parsed && ANTHROPIC_IMAGE_TYPES.has(parsed.mimeType)) {
      mediaBlocks.push({ type: "image", source: { type: "base64", media_type: parsed.mimeType, data: parsed.base64 } });
      continue;
    }
    if (att.kind === "file" && parsed && parsed.mimeType === "application/pdf") {
      mediaBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: parsed.base64 } });
      continue;
    }
    const asText = attachmentAsText(att);
    if (asText != null) {
      textBody += `\n\n${formatAttachmentForPrompt(att)}`;
      continue;
    }
    warnings.push(
      `Attachment "${att.name}" (${att.mimeType}) isn't supported by Anthropic's Messages API and was left out of the request -- only images, PDFs, and text-like files can be inlined here.`,
    );
  }

  if (mediaBlocks.length === 0) return { content: textBody, warnings };
  return { content: [{ type: "text", text: textBody }, ...mediaBlocks], warnings };
}

interface GeminiInlinePart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

// Gemini's inline (non-File-API) request body is capped around 20MB total; leave headroom for
// the rest of the payload rather than pushing right up to that limit per attachment.
const GEMINI_INLINE_MAX_BYTES = 15 * 1024 * 1024;

/** Builds Gemini `generateContent` parts. Unlike the other protocols, Gemini's inlineData accepts
 *  arbitrary mime types -- image, video, audio, PDF, plain text -- as long as the base64 payload
 *  stays under the inline size cap; only oversized attachments get warned about and dropped. */
export function buildGeminiParts(
  prompt: string,
  attachments: Attachment[] | undefined,
): { parts: GeminiInlinePart[]; warnings: string[] } {
  if (!attachments?.length) return { parts: [{ text: prompt }], warnings: [] };

  const warnings: string[] = [];
  const parts: GeminiInlinePart[] = [{ text: prompt }];

  for (const att of attachments) {
    if (att.kind === "text") {
      parts.push({ text: `\n\n${formatAttachmentForPrompt(att)}` });
      continue;
    }
    const parsed = att.dataUrl ? parseDataUrl(att.dataUrl) : null;
    if (!parsed) {
      warnings.push(`Attachment "${att.name}" had no usable data and was left out of the request.`);
      continue;
    }
    if (parsed.base64.length > GEMINI_INLINE_MAX_BYTES) {
      warnings.push(
        `Attachment "${att.name}" is too large to inline (>${Math.round(GEMINI_INLINE_MAX_BYTES / (1024 * 1024))}MB) and was left out of the request.`,
      );
      continue;
    }
    parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.base64 } });
  }

  return { parts, warnings };
}
