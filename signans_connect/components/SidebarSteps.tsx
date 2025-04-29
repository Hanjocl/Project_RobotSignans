'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SidebarStepsProps {
  onStepClick: (step: string) => void;  // Callback to handle step clicks
}

const SidebarSteps: React.FC<SidebarStepsProps> = ({ onStepClick }) => {
  // WebSocket for managing step statuses
  const socket = useRef<WebSocket | null>(null);

  // States to track steps' statuses
  const [stepStatuses, setStepStatuses] = useState({
    'home-axis': false,
    'connect-wires': false,
    'pre-draw-checklist': false,
    'send-it': false,
  });

  // Connect to WebSocket and receive step updates
  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:8000/ws/steps/");

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data); // Assuming the server sends JSON data with step statuses
      setStepStatuses(data);
    };

    socket.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      socket.current?.close();
    };
  }, []);

  return (
    <div className="w-1/5 bg-base-200 p-2 rounded flex flex-col space-y-2 min-w-[200px] overflow-hidden">
      <ul className="steps steps-vertical">
        <li
          className={`step cursor-pointer hover:bg-gray-200 ${stepStatuses['home-axis'] ? 'step-primary' : ''}`}
          onClick={() => onStepClick('home-axis')}
        >
          Home Axis
        </li>
        <li
          className={`step cursor-pointer hover:bg-gray-200 ${stepStatuses['connect-wires'] ? 'step-primary' : ''}`}
          onClick={() => onStepClick('connect-wires')}
        >
          Connect wires
        </li>
        <li
          className={`step cursor-pointer hover:bg-gray-200 ${stepStatuses['pre-draw-checklist'] ? 'step-primary' : ''}`}
          onClick={() => onStepClick('pre-draw-checklist')}
        >
          Pre-Draw Checklist
        </li>
        <li
          className={`step cursor-pointer hover:bg-gray-200 ${stepStatuses['send-it'] ? 'step-primary' : ''}`}
          onClick={() => onStepClick('send-it')}
        >
          Send It!
        </li>
      </ul>
    </div>
  );
};

export default SidebarSteps;
