'use client';
import React from "react";
import { useState, useEffect, useRef } from 'react';
import ProgressBar from '../components/ProgressBar';
import SidebarSteps from '../components/SidebarSteps';
import { useConnected } from "../context/ConnectedContext";


// pages/index.js
export default function Dashboard() {

  const socket_cmd = useRef<WebSocket | null>(null);

  const [manualInput, setManualInput] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const { connected } = useConnected();

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

    // Handle manual input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput(event.target.value);
  };

  const handleClick = (step : string) => {
    console.log(`Clicked on ${step}`);
    // You can perform any action based on the clicked step, 
    // such as navigating to another page, updating the UI, etc.
  };

  const sendManualInput = (): void => {
    console.log(`Manual Input: ${manualInput}`);
    // You can modify this to send the manual input to a WebSocket or any other API
    alert(`Sending: ${manualInput}`);
  };

  const sendCommand = (cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      socket_cmd.current.send(cmd);
      alert(`Sending: ${cmd}`);
    }
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
        <div className="bg-base-200 p-4 rounded flex flex-col h-3/3">
          <div className="flex flex-col-reverse gap-2 overflow-y-auto flex-grow p-2 py-4">
            {/* Terminal messages list */}
            <ul className="w-full list-none p-0 m-0">
              {messages.map((message, index) => (
                <li key={index} className="text-sm">{message}</li>
              ))}
            </ul>
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
            <button className={`btn justify-start w-1/5 ${!connected ? 'btn-disabled' : 'btn-outline btn-error'}`}  onClick={sendManualInput}>Send</button>
          </div>
          <ProgressBar animate={loading} />
          
        </div>
        

        {/* Control */}
        <div className="flex flex-col flex-grow gap-4 bg-base-200 p-4 rounded  h-1/3 w-full">
          {['X', 'Y', 'Z'].map((axis) => (
            <div key={axis} className="flex items-center gap-4 h-1/3 w-full">
              <button className="btn btn-outline w-1/4">-</button>
              <div className="text-center w-full min-w-[80px]">Position of Axis {axis}</div>
              <button className="btn btn-outline w-1/4">+</button>
              <button className="btn btn-sm btn-info w-1/6">home </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




/*
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
  }, []);*/