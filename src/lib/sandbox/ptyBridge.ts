import type WebSocket from "ws";
import { getSession, spawnSession, stopSession } from "./sessionManager";

const CONTROL = 0x01;
const DATA = 0x02;

const RESIZE_FALLBACK_MS = 300;
const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 24;

interface ControlMessage {
  type: "resize" | "stop";
  cols?: number;
  rows?: number;
}

function encodeControl(obj: unknown): Buffer {
  return Buffer.concat([Buffer.from([CONTROL]), Buffer.from(JSON.stringify(obj))]);
}

function encodeData(chunk: string): Buffer {
  return Buffer.concat([Buffer.from([DATA]), Buffer.from(chunk, "utf-8")]);
}

/**
 * Attaches this WS to the session's pty and returns a detach function that
 * unhooks *only this connection's* listeners. The pty/container keep running
 * after detach -- a session's lifetime is independent of any one WS
 * connection so it can be reattached from the active-sessions list, and so
 * dev-mode remounts (React StrictMode double-invokes effects, closing and
 * reopening the WS) don't tear down the session out from under themselves.
 */
async function attachPty(
  sessionId: string,
  ws: WebSocket,
  cols: number,
  rows: number,
): Promise<(() => void) | null> {
  const ptyProcess = await spawnSession(sessionId, cols, rows);
  if (!ptyProcess) {
    ws.send(encodeControl({ type: "error", message: "Failed to start sandbox container" }));
    ws.close();
    return null;
  }
  ws.send(encodeControl({ type: "ready" }));
  const dataSub = ptyProcess.onData((chunk) => {
    if (ws.readyState === ws.OPEN) ws.send(encodeData(chunk));
  });
  const exitSub = ptyProcess.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(encodeControl({ type: "exit", code: exitCode }));
      ws.close();
    }
  });
  return () => {
    dataSub.dispose();
    exitSub.dispose();
  };
}

export function handleSandboxUpgrade(sessionId: string, ws: WebSocket): void {
  const record = getSession(sessionId);
  if (!record) {
    ws.send(encodeControl({ type: "error", message: "Session not found" }));
    ws.close();
    return;
  }

  let spawned = false;
  let detach: (() => void) | null = null;

  async function spawn(cols: number, rows: number) {
    detach = await attachPty(sessionId, ws, cols, rows);
  }

  const fallback = setTimeout(() => {
    if (!spawned) {
      spawned = true;
      void spawn(DEFAULT_COLS, DEFAULT_ROWS);
    }
  }, RESIZE_FALLBACK_MS);

  ws.on("message", (raw: Buffer) => {
    if (raw.length === 0) return;
    const prefix = raw[0];
    const payload = raw.subarray(1);

    if (prefix === CONTROL) {
      let msg: ControlMessage;
      try {
        msg = JSON.parse(payload.toString("utf-8"));
      } catch {
        return;
      }
      if (msg.type === "resize") {
        const cols = msg.cols ?? DEFAULT_COLS;
        const rows = msg.rows ?? DEFAULT_ROWS;
        if (!spawned) {
          spawned = true;
          clearTimeout(fallback);
          void spawn(cols, rows);
        } else {
          getSession(sessionId)?.ptyProcess?.resize(cols, rows);
        }
      } else if (msg.type === "stop") {
        // Don't close the socket here -- that races the pty's own "exit"
        // event (fired asynchronously off ptyProcess.kill() below) and can
        // win, which swallows the "exit" control message attachPty's
        // exitSub would otherwise send. Let that natural exit flow message
        // the client and close the socket.
        void stopSession(sessionId);
      }
      return;
    }

    if (prefix === DATA) {
      getSession(sessionId)?.ptyProcess?.write(payload.toString("utf-8"));
    }
  });

  ws.on("close", () => {
    clearTimeout(fallback);
    detach?.();
  });
}
