'use client';
import React from "react";
import { useState, useEffect, useRef } from 'react';
import ProgressBar from '../components/ProgressBar';
import SidebarSteps from '../components/SidebarSteps';
import { getContext } from "../context/ConnectedContext";


// pages/index.js
export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  const { state, connected } = getContext();

  const toggleLoading = () => {
    setLoading((prev) => !prev); // Toggle the loading state between true and false
  };

  // Handle click on a step
  const handleStepClick = (step: string) => {
    console.log(`Clicked on ${step}`);
    // You can send a command to the WebSocket server or perform any action based on the clicked step
    if (connected) {
      alert(`Step clicked: ${step}`);
    }
  };

  
  // Temporary messages array
  const [messages, setMessages] = useState([
    "Welcome to the terminal!",
    "System initialized successfully.",
    "Waiting for input...",
    "Incoming message: Command received.",
    "Processing request..."
  ]);

  {/* Manual Input */}
  const socket_cmd = useRef<WebSocket | null>(null);

  const [logs, setLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState<string>('');

  useEffect(() => {
    // Connect to WebSocket server
    socket_cmd.current= new WebSocket("ws://localhost:8000/ws/commander/");

    socket_cmd.current.onmessage = (event) => {
      setLogs((prevLogs) => [...prevLogs, `${event.data}`]);
    };

    socket_cmd.current.onclose = () => {
      setLogs((prevLogs) => [...prevLogs, "Disconnected from server"]);
    };

    return () => {
      socket_cmd.current?.close();
    };
  }, []);

  const sendManualInput = (): void => {
    console.log(`Manual Input: ${manualInput}`);
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      socket_cmd.current.send(manualInput);
    }
  };

  const sendCommand = (cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      alert(`A homing move (${cmd}) will be send. \n MAKE SURE THE ARM IS NOT CONNECTED TO THE MOTORS. \n\n If you wish to CANCEL, RELOAD the page.`);
      socket_cmd.current.send(cmd);
    }
  };

  const sendRelativeMove = (cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      socket_cmd.current.send("G91");
      socket_cmd.current.send(cmd);
      socket_cmd.current.send("G90");
    }
  };

    // Handle manual input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput(event.target.value);
  };

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  const handleClick = (step : string) => {
    console.log(`Clicked on ${step}`);
    // You can perform any action based on the clicked step, 
    // such as navigating to another page, updating the UI, etc.
  };
  
  return (
    <div className="flex flex-1 gap-4">
      {/* Sidebar with Vertical Steps */}
      <SidebarSteps onStepClick={handleStepClick} />

      {/* Main Panel */}
      <div className="w-full bg-base-200 p-4 rounded flex items-center justify-center">
        panel changes for each item
      </div>

      {/* Terminal & Controls */}
      <div className="w-1/2 flex flex-col space-y-4 h-full">
        {/* Terminal*/}
        <div className="bg-base-200 p-4 rounded flex flex-col h-full">

          {/* Messages List */}
          <div ref={logRef} className="log-output max-h-[60vh] overflow-auto text-sm">
            <pre className="whitespace-pre-wrap">{logs.join('\n')}</pre>
          </div>

          {/* Manual Input and Send Button inside the Terminal */}
          <div className="mt-auto flex gap-2">
            <input
              type="text"
              placeholder= {`${!connected ? 'pleaes connect a device' : 'For manual input only'}`}
              className={`input w-full ${!connected ? 'input-disabled' : 'input-outline input-error'}`}
              value={manualInput}
              onChange={handleInputChange}
            />
            <button className={`btn justify-start w-1/5 ${!connected ? 'btn-disabled' : 'btn-outline btn-error'}`}  onClick={() => state != "Drawing" ? manualInput : alert("Cannot send commands while drawing!") }>Send</button>
          </div>
          <ProgressBar animate={loading} />
          
        </div>
        

        {/* Control */}
        <div className="flex flex-col flex-grow gap-4 bg-base-200 p-4 rounded  h-1/3 w-full">
          {['X', 'Y', 'Z'].map((axis) => (
            <div key={axis} className="flex items-center gap-4 h-1/3 w-full">
              <button className="btn btn-outline w-1/12" onClick={() => state != "Drawing" ? sendRelativeMove(`G0 ${axis}-10`) : alert("Cannot send commands while drawing!") } >-10</button>
              <button className="btn btn-outline w-1/12" onClick={() => state != "Drawing" ? sendRelativeMove(`G0 ${axis}-5`) : alert("Cannot send commands while drawing!") } >-5</button>
              <button className="btn btn-outline w-1/12" onClick={() => state != "Drawing" ? sendRelativeMove(`G0 ${axis}-1`) : alert("Is drawing!") } >-1</button>
              <div className="text-center w-full min-w-[80px]">Position of Axis {axis}</div>
              <button className="btn btn-outline w-1/12" onClick={() => state != "Drawing" ? sendRelativeMove(`G0 ${axis}1`) : alert("Cannot send commands while drawing!") } >+1</button>
              <button className="btn btn-outline w-1/12" onClick={() => state != "Drawing" ? sendRelativeMove(`G0 ${axis}5`) : alert("Cannot send commands while drawing!") } >+5</button>
              <button className="btn btn-outline w-1/12" onClick={() => state != "Drawing" ? sendRelativeMove(`G0 ${axis}10`) : alert("Cannot send commands while drawing!") } >+10</button>
              <button className="btn btn-sm btn-info w-1/6" onClick={() => state != "Drawing" ? sendCommand(`G28 ${axis}`) : alert("Cannot send commands while drawing!") } >home </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}