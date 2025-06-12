'use client';
import React from "react";
import { useState, useEffect, useRef } from 'react';
import SidebarSteps from "@/components/SidebarSteps";
import { getStepStatus } from "@/context/StepsContext";
import StepHoming from "@/components/Steps/StepHoming";
import StepConnectWires from "@/components/Steps/StepConnectWires";
import StepFinalChecklist from "@/components/Steps/StepFinalChecklist";
import StepCameraCalibration from "@/components/Steps/StepCameraCalibration";
import StepCornerCalibration from "@/components/Steps/StepCornerCalibration";
import TerminalPanel from "@/components/TerminalPanel";
import ProtectedRoute from '@/components/ProtectedRoute';

// pages/index.js
export default function Dashboard() {
  const { steps, socketSteps  } = getStepStatus();

  {/* Manual Input */}
  
  const [logs, setLogs] = useState<string[]>([]);
  
  const socket_cmd = useRef<WebSocket | null>(null);
  useEffect(() => {
    // Connect to WebSocket server
    socket_cmd.current= new WebSocket("ws://robosignans2:8000/ws/commander/");

    socket_cmd.current.onmessage = (event) => {
      setLogs((prevLogs) => [...prevLogs, `${event.data}`]);
    };

    socket_cmd.current.onclose = () => {
      setLogs((prevLogs) => [...prevLogs, "Disconnected from server -> please reload window after reconnecting"]);
    };

    socket_cmd.current.onerror = (error) => {
      setLogs(prev => [...prev, "WebSocket error"]);
      console.error("WebSocket error:", error);
    };

    return () => {
      socket_cmd.current?.close();
    };
  }, []); 

  const sendHomingCommand = (cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      alert(`A homing move (${cmd}) will be send. \n MAKE SURE THE ARM IS NOT CONNECTED TO THE MOTORS. \n\n If you wish to CANCEL, RELOAD the page.`);
      socket_cmd.current.send(cmd);
    }
  };

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);
  
  const [selectedStep, setSelectedStep] = useState("Homing");
  
  const handleStepComplete = (step: string) => {
    if (socketSteps && socketSteps.readyState === WebSocket.OPEN) {
      switch (step) {
        case "Connect Wires":
          alert(`${step} will be complete. \n MAKE SURE ALL THE WIRES ARE TENSIONED BEFORE CONTINUING. \n\n If you wish to CANCEL, RELOAD the page.`);
          break;
        case "Corner Calibration":
          alert(`${step} has been completed.`);
          break;
        case "Camera Calibration":
          alert(`${step} will be complete.`);
          break;
        case "Final Checklist":
          alert(`${step} will be complete. After this THE ARM WILL BE LIVE. Please make sure you are ready...`);
          break;
      }

      // Send step completion update via WebSocket
      socketSteps.send(JSON.stringify({
        step: step,
        status: "complete"
      }));
    } else {
      console.log("Failed to get socket for step updates");
    }
  };

  const renderStepComponent = () => {
    // Find the current step status dynamically
    const getStatus = (stepName: string) => {
      return steps.find(step => step.step === stepName)?.status || "pending";
    };

    switch (selectedStep) {
      case "Homing":
        return <StepHoming sendHomingCommand={sendHomingCommand} handleStepComplete={handleStepComplete} status={getStatus("Homing")} />;
      case "Connect Wires":
        return <StepConnectWires handleStepComplete={handleStepComplete} status={getStatus("Connect Wires")} />;
      case "Corner Calibration":
        return <StepCornerCalibration handleStepComplete={handleStepComplete} status={getStatus("Corner Calibration")} />;
      case "Camera Calibration":
        return <StepCameraCalibration handleStepComplete={handleStepComplete} status={getStatus("Camera Calibration")} />;
      case "Final Checklist":
        return <StepFinalChecklist handleStepComplete={handleStepComplete} status={getStatus("Final Checklist")}/>;
      default:
        return <div>Select a step</div>;
    }
  };
  
  return (
    <ProtectedRoute password="1234567890">
      <div className="flex flex-1 gap-4">
        {/* Sidebar with Vertical Steps */}
        <SidebarSteps
          steps={steps}
          selectedStep={selectedStep}
          onStepClick={setSelectedStep}
        />

        {/* Main Panel */}
        <div className="w-full bg-base-200 p-4 rounded">
          {renderStepComponent()}
        </div>

        <TerminalPanel />
      </div>  
    </ProtectedRoute>
  );
}