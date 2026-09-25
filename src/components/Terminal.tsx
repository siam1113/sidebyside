"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const CONTROL = 0x01;
const DATA = 0x02;

interface Props {
  sessionId: string;
  onExit?: (code: number | null) => void;
}

export interface TerminalHandle {
  stop: () => void;
}

function frame(prefix: number, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(payload.length + 1);
  out[0] = prefix;
  out.set(payload, 1);
  return out;
}

export const TerminalView = forwardRef<TerminalHandle, Props>(function TerminalView(
  { sessionId, onExit },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const sendControlRef = useRef<(obj: unknown) => void>(() => {});

  useImperativeHandle(ref, () => ({
    stop: () => sendControlRef.current({ type: "stop" }),
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new XTerm({
      cursorBlink: true,
      convertEol: true,
      theme: { background: "#050507", cursor: "#67e8f9", cursorAccent: "#050507" },
      fontSize: 13,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${wsProtocol}://${window.location.host}/ws/sandbox/${sessionId}`);
    ws.binaryType = "arraybuffer";
    let exitReceived = false;
    let unmounting = false;

    function sendControl(obj: unknown) {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(frame(CONTROL, encoder.encode(JSON.stringify(obj))));
    }

    function sendData(chunk: string) {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(frame(DATA, encoder.encode(chunk)));
    }

    sendControlRef.current = sendControl;

    ws.addEventListener("open", () => {
      sendControl({ type: "resize", cols: term.cols, rows: term.rows });
    });

    ws.addEventListener("message", (event) => {
      const buf = new Uint8Array(event.data as ArrayBuffer);
      if (buf.length === 0) return;
      const prefix = buf[0];
      const payload = buf.subarray(1);
      if (prefix === DATA) {
        term.write(decoder.decode(payload));
      } else if (prefix === CONTROL) {
        const msg = JSON.parse(decoder.decode(payload));
        if (msg.type === "exit") {
          exitReceived = true;
          term.write(
            `\r\n\n[process exited${msg.code != null ? ` with code ${msg.code}` : ""}]\r\n`,
          );
          onExitRef.current?.(msg.code ?? null);
        } else if (msg.type === "error") {
          term.write(`\r\n\n[error] ${msg.message}\r\n`);
        }
      }
    });

    // Fallback for a socket that closes without an "exit" control message
    // (server restart, dropped connection, etc.) -- without this the UI
    // would stay stuck showing "Running" forever.
    ws.addEventListener("close", () => {
      if (exitReceived || unmounting) return;
      term.write(`\r\n\n[connection closed]\r\n`);
      onExitRef.current?.(null);
    });

    const dataDisposable = term.onData((data) => sendData(data));

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      sendControl({ type: "resize", cols: term.cols, rows: term.rows });
    });
    resizeObserver.observe(container);

    return () => {
      unmounting = true;
      sendControlRef.current = () => {};
      dataDisposable.dispose();
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [sessionId]);

  return <div ref={containerRef} className="h-full w-full" />;
});
