"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import type { Attachment } from "@/lib/gateways/types";

interface Props {
  prompt: string;
  onPromptChange: (v: string) => void;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  placeholder?: string;
  rows?: number;
}

// Long pastes get collapsed into a "Pasted text" chip instead of ballooning the textarea --
// short pastes just behave like normal typing.
const PASTE_TEXT_CHIP_THRESHOLD = 400;

function classifyMime(mimeType: string): Attachment["kind"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `att-${Date.now()}-${Math.random()}`;
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
      <rect x="1.5" y="3.5" width="9" height="9" rx="1.5" />
      <path d="M10.5 6.5l4-2v7l-4-2" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
      <path d="M4 1.5h5l3 3v10h-8v-13Z" strokeLinejoin="round" />
      <path d="M9 1.5v3h3" strokeLinejoin="round" />
    </svg>
  );
}

function TextChipIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
      <path d="M2.5 3.5h11M2.5 7h11M2.5 10.5h7" strokeLinecap="round" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M11 4.5v6a3 3 0 1 1-6 0v-7a2 2 0 1 1 4 0v6.5a1 1 0 1 1-2 0v-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
      <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
    </svg>
  );
}

/** Single chat-style composer: attachment chips, textarea, and an inline attach control all
 *  live in one bordered shell (rather than a separate attachment box under the prompt), the way
 *  a modern chat input works. Handles the file picker, drag-and-drop onto the whole shell,
 *  clipboard image paste, and long-pasted-text collapsing into a chip -- provider-side support for
 *  each attachment kind varies (see gateways/adapters/attachments.ts); unsupported ones surface a
 *  warning on the result instead of failing the whole run. */
export function PromptComposer({
  prompt,
  onPromptChange,
  attachments,
  onAttachmentsChange,
  placeholder,
  rows = 8,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function addFiles(files: FileList | File[]) {
    const next: Attachment[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await fileToDataUrl(file);
      next.push({
        id: newId(),
        kind: classifyMime(file.type || "application/octet-stream"),
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        size: file.size,
      });
    }
    onAttachmentsChange([...attachments, ...next]);
  }

  function removeAttachment(id: string) {
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        addFiles([file]);
        return;
      }
    }
    const text = e.clipboardData.getData("text/plain");
    if (text.length > PASTE_TEXT_CHIP_THRESHOLD) {
      e.preventDefault();
      onAttachmentsChange([
        ...attachments,
        {
          id: newId(),
          kind: "text",
          name: `Pasted text (${text.length.toLocaleString()} chars)`,
          mimeType: "text/plain",
          text,
          size: text.length,
        },
      ]);
    }
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-black/30 p-2 transition-colors duration-150 focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-300/15 ${
        dragOver ? "border-cyan-300/50 bg-cyan-300/[0.04]" : "border-white/10"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group flex items-center gap-1.5 rounded-md bg-white/[0.05] py-1 pl-1.5 pr-1 text-[11px] text-neutral-300"
              title={att.kind === "text" ? att.text : `${att.name} (${att.mimeType})`}
            >
              {att.kind === "image" && att.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.dataUrl} alt={att.name} className="h-5 w-5 rounded object-cover" />
              ) : att.kind === "video" ? (
                <VideoIcon />
              ) : att.kind === "text" ? (
                <TextChipIcon />
              ) : (
                <FileIcon />
              )}
              <span className="max-w-[160px] truncate">{att.name}</span>
              {att.size != null && att.kind !== "text" && (
                <span className="shrink-0 text-neutral-600">{formatBytes(att.size)}</span>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-0.5 shrink-0 rounded p-0.5 text-neutral-500 transition-colors duration-150 hover:bg-white/10 hover:text-neutral-200"
                aria-label={`Remove ${att.name}`}
              >
                <RemoveIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="w-full resize-y bg-transparent px-0.5 py-0.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
        rows={rows}
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onPaste={onPaste}
      />

      <div className="flex items-center justify-between px-0.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image, video, or file"
          aria-label="Attach image, video, or file"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-white/10 hover:text-neutral-200"
        >
          <PaperclipIcon />
        </button>
        <span className="text-[10px] text-neutral-600">drop files, or paste an image</span>
      </div>
    </div>
  );
}
