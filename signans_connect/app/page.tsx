'use client';

import { useState, useEffect, useRef } from 'react';

// pages/index.js
export default function HomePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const socket_cmd = useRef<WebSocket | null>(null);

  const sendCommand = (cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      socket_cmd.current.send(cmd);
      setLogs((prevLogs) => [...prevLogs, `You: ${cmd}`]);
    }
  };

  useEffect(() => {
    // Connect to WebSocket server
    socket_cmd.current= new WebSocket("ws://localhost:8000/ws/commander/");

    socket_cmd.current.onmessage = (event) => {
      setLogs((prevLogs) => [...prevLogs, `Server: ${event.data}`]);
    };

    socket_cmd.current.onclose = () => {
      setLogs((prevLogs) => [...prevLogs, "Disconnected from server"]);
    };

    return () => {
      socket_cmd.current?.close();
    };
  }, []);


  return (
    <div className="flex h-screen">
      {/* Buttons on the left */}
      <div className="w-1/4 p-4 space-y-4">
        <button className="btn btn-primary w-full" onClick={() => sendCommand("G28 X")}>Home X</button>
        <button className="btn btn-primary w-full" onClick={() => sendCommand("G28 Y")}>Home Y</button>
        <button className="btn btn-primary w-full" onClick={() => sendCommand("G28 Z")}>Home Z</button>
        <button className="btn btn-secondary w-full" onClick={() => sendCommand("G0 X0 Y0 Z-195")}>Go to a position</button>
        <button className="btn btn-accent w-full">KILL</button>
      </div>

      {/* Terminal on the right */}
      <div className="w-3/4 p-4 bg-gray-800 text-white rounded-lg">
        <pre className="font-mono">Terminal</pre>
      </div>
    </div>
  );
}




const sendG28 = async () => {
  try {
    const res = await fetch("http://localhost:8000/g28", {
      method: "POST",
    });
    const data = await res.json();
    alert(`Command Sent: ${data.command}`);
  } catch (err) {
    alert("Failed to send command");
  }
};
