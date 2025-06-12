'use client';

import React, { useEffect, useRef, useState } from 'react';
import ProgressBar from './ProgressBar';
import { getConnectionStatus } from "../context/ConnectedContext";

export default function TerminalPanel() {
  const { state, connected } = getConnectionStatus();

  const [logs, setLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const socket_cmd = useRef<WebSocket | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  // Connect WebSocket
  useEffect(() => {
    socket_cmd.current = new WebSocket("ws://robosignans2:8000/ws/commander/");

    socket_cmd.current.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    socket_cmd.current.onclose = () => {
      setLogs(prev => [...prev, "Disconnected from server -> please reload window after reconnecting"]);
    };

    return () => {
      socket_cmd.current?.close();
    };
  }, []);

  // Auto scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
    }

    const lastLog = logs[logs.length - 1];
    if (lastLog && !lastLog.toLowerCase().includes("ok")) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [logs]);

  const sendManualCommand = () => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN && !loading) {
      socket_cmd.current.send(manualInput);
      setManualInput('');
    } else if (loading) {
      console.log("Wait for next movement to complete");
    } else {
      console.log("WebSocket is not open");
    }
  };

  const sendHomingCommand = (cmd: string) => {
    if (socket_cmd.current?.readyState === WebSocket.OPEN) {
      alert(`A homing move (${cmd}) will be sent.\nMAKE SURE THE ARM IS NOT CONNECTED TO THE MOTORS.\n\nTo CANCEL, reload the page.`);
      socket_cmd.current.send(cmd);
    }
  };

  const sendRelativeMove = (cmd: string) => {
    if (socket_cmd.current?.readyState === WebSocket.OPEN) {
      socket_cmd.current.send("G91");
      socket_cmd.current.send(cmd);
      socket_cmd.current.send("G90");
    }
  };

  const canSend = connected && state !== "Drawing";

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Terminal Output */}
      <div className="bg-base-200 p-4 rounded flex flex-col h-full">
        <div ref={logRef} className="log-output max-h-[60vh] overflow-auto text-sm">
          <pre className="whitespace-pre-wrap">{logs.join('\n')}</pre>
        </div>

        {/* Manual Input */}
        <div className="mt-auto flex gap-2">
          <input
            type="text"
            placeholder={!connected ? 'Please connect a device' : 'For manual input only'}
            className={`input w-full ${!connected ? 'input-disabled' : 'input-outline input-error'}`}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!canSend) return alert("Cannot send commands while drawing!");
                sendManualCommand();
              }
            }}
          />
          <button
            className={`btn justify-start w-1/5 ${!canSend || loading ? 'btn-disabled' : 'btn-outline btn-error'}`}
            onClick={() => {
              if (!canSend) return alert("Cannot send commands while drawing!");
              sendManualCommand();
            }}
          >
            Send
          </button>
        </div>
        <ProgressBar animate={loading} />
      </div>

      {/* Axis Control Panel */}
      <div className="flex flex-col flex-grow gap-4 bg-base-200 p-4 rounded h-1/3 w-full">
        {['X', 'Y', 'Z'].map((axis) => (
          <div key={axis} className="flex items-center gap-4 h-1/3 w-full">
            {[-10, -5, -1].map(val => (
              <button key={val} className="btn btn-outline w-1/12"
                onClick={() => canSend ? sendRelativeMove(`G0 ${axis}${val}`) : alert("Cannot send commands while drawing!")}>
                {val}
              </button>
            ))}
            <div className="text-center w-full min-w-[80px]">Position of Axis {axis}</div>
            {[1, 5, 10].map(val => (
              <button key={val} className="btn btn-outline w-1/12"
                onClick={() => canSend ? sendRelativeMove(`G0 ${axis}${val}`) : alert("Cannot send commands while drawing!")}>
                +{val}
              </button>
            ))}
            <button
              className="btn btn-sm btn-info w-1/6"
              onClick={() => canSend ? sendHomingCommand(`G28 ${axis}`) : alert("Cannot send commands while drawing!")}
            >
              home
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
