'use client';

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import ProgressBar from './ProgressBar';
import { getConnectionStatus } from "../context/ConnectedContext";
import { WS_ENDPOINTS } from "@/context/WebSockets";

export type CommanderAPI = {
  sendHomingCommand: (cmd: string) => void;
  sendRelativeMove: (cmd: string) => void;
  sendManualCommand: (cmd: string) => void;
};

const AXIS_VALUES: Record<'X' | 'Y' | 'Z', number[]> = {
  X: [80, 40, 20],
  Y: [80, 40, 20],
  Z: [20, 10, 5],
};

const TerminalPanel = forwardRef<CommanderAPI>(function TerminalPanel(_, ref) {
  const { state, connected } = getConnectionStatus();

  const [logs, setLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // ---------------- WebSocket lifecycle ----------------
  useEffect(() => {
    if (socketRef.current) return;

    const ws = new WebSocket(WS_ENDPOINTS.commander);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      setLogs((prev) => [...prev, e.data]);
    };

    ws.onclose = () => {
      setLogs((prev) => [...prev, "Disconnected from server"]);
    };

    ws.onerror = () => {
      setLogs((prev) => [...prev, "WebSocket error"]);
    };
  }, []);

  // ---------------- Commander helpers ----------------
  const sendRelativeMoveInternal = (cmd: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send("G91");
      socketRef.current.send(cmd);
      socketRef.current.send("G90");
    }
  };

  const sendHomingInternal = (cmd: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      alert(
        `A homing move (${cmd}) will be sent.\nMAKE SURE THE ARM IS NOT CONNECTED TO THE MOTORS.`
      );
      socketRef.current.send(cmd);
    }
  };

  // ---------------- expose API to Dashboard ----------------
  useImperativeHandle(ref, () => ({
    sendHomingCommand: sendHomingInternal,
    sendRelativeMove: sendRelativeMoveInternal,
    sendManualCommand(cmd: string) {
      if (socketRef.current?.readyState === WebSocket.OPEN && !loading) {
        socketRef.current.send(cmd);
      }
    },
  }));

  // ---------------- auto-scroll + loading ----------------
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTo({
        top: logRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }

    const last = logs[logs.length - 1];
    setLoading(!!last && !last.toLowerCase().includes("ok"));
  }, [logs]);

  const canSend = connected && state !== "Drawing";

  // ---------------- UI ----------------
  return (
    <div className="flex flex-col space-y-4 h-full w-full">
      {/* -------- Terminal -------- */}
      <div className="bg-base-200 p-4 rounded flex flex-col h-full">
        <div
          ref={logRef}
          className="log-output max-h-[55vh] overflow-auto text-sm"
        >
          <pre className="whitespace-pre-wrap">{logs.join('\n')}</pre>
        </div>

        {/* Manual Input */}
        <div className="mt-auto flex gap-2">
          <input
            type="text"
            placeholder={!connected ? 'Please connect a device' : 'Manual G-code'}
            className={`input w-full ${
              !connected ? 'input-disabled' : 'input-outline input-error'
            }`}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSend) {
                socketRef.current?.send(manualInput);
                setManualInput('');
              }
            }}
          />
          <button
            className={`btn w-1/5 ${
              !canSend || loading ? 'btn-disabled' : 'btn-outline btn-error'
            }`}
            onClick={() => {
              socketRef.current?.send(manualInput);
              setManualInput('');
            }}
          >
            Send
          </button>
        </div>

        <ProgressBar animate={loading} />
      </div>

      {/* -------- Quick Move Panel -------- */}
      <div className="bg-base-200 p-4 rounded space-y-3">
        <div className="font-semibold text-sm">Quick Move</div>

        {(Object.keys(AXIS_VALUES) as Array<'X' | 'Y' | 'Z'>).map((axis) => (
          <div key={axis} className="flex items-center gap-4">
            {AXIS_VALUES[axis].map((val) => (
              <button
                key={`${axis}-neg-${val}`}
                className="btn btn-outline btn-sm w-16"
                disabled={!canSend}
                onClick={() => sendRelativeMoveInternal(`G0 ${axis}-${val}`)}
              >
                -{val}
              </button>
            ))}

            <div className="flex-1 text-center text-sm">
              Axis {axis}
            </div>

            {AXIS_VALUES[axis].map((val) => (
              <button
                key={`${axis}-pos-${val}`}
                className="btn btn-outline btn-sm w-16"
                disabled={!canSend}
                onClick={() => sendRelativeMoveInternal(`G0 ${axis}${val}`)}
              >
                +{val}
              </button>
            ))}

            <button
              className="btn btn-info btn-sm w-20"
              disabled={!canSend}
              onClick={() => sendHomingInternal(`G28 ${axis}`)}
            >
              Home
            </button>
          </div>
        ))}
      </div>

    </div>
  );
});

export default TerminalPanel;
