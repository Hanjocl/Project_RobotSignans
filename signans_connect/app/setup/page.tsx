'use client';

import React, { useRef, useState } from "react";
import SidebarSteps from "@/components/SidebarSteps";
import { getStepStatus } from "@/context/StepsContext";
import StepHoming from "@/components/Steps/StepHoming";
import StepConnectWires from "@/components/Steps/StepConnectWires";
import StepFinalChecklist from "@/components/Steps/StepFinalChecklist";
import StepCameraCalibration from "@/components/Steps/StepCameraCalibration";
import StepCornerCalibration from "@/components/Steps/StepCornerCalibration";
import TerminalPanel, { CommanderAPI } from "@/components/TerminalPanel";
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { steps, socketSteps } = getStepStatus();
  const [selectedStep, setSelectedStep] = useState("Homing");

  const terminalRef = useRef<CommanderAPI>(null);

  // ---------------- commander delegation ----------------
  const sendHomingCommand = (cmd: string) => {
    terminalRef.current?.sendHomingCommand(cmd);
  };

  // ---------------- step completion ----------------
  const handleStepComplete = (step: string) => {
    // 🔔 Pop-up notifications (restored)
    switch (step) {
      case "Connect Wires":
        alert(
          `${step} will be completed.\n\n` +
          `MAKE SURE ALL WIRES ARE TENSIONED BEFORE CONTINUING.`
        );
        break;

      case "Corner Calibration":
        alert(`${step} has been completed.`);
        break;

      case "Camera Calibration":
        alert(`${step} will be completed.`);
        break;

      case "Final Checklist":
        alert(
          `${step} will be completed.\n\n` +
          `AFTER THIS STEP THE ARM WILL BE LIVE.\n` +
          `MAKE SURE YOU ARE READY.`
        );
        break;
    }

    // ✅ Notify backend via Steps socket
    if (socketSteps && socketSteps.readyState === WebSocket.OPEN) {
      socketSteps.send(
        JSON.stringify({
          step,
          status: "complete",
        })
      );
    } else {
      console.warn("Steps WebSocket not connected");
    }
  };

  // ---------------- helpers ----------------
  const getStatus = (stepName: string) =>
    steps.find(s => s.step === stepName)?.status || "pending";

  const renderStepComponent = () => {
    switch (selectedStep) {
      case "Homing":
        return (
          <StepHoming
            sendHomingCommand={sendHomingCommand}
            handleStepComplete={handleStepComplete}
            status={getStatus("Homing")}
          />
        );

      case "Connect Wires":
        return (
          <StepConnectWires
            handleStepComplete={handleStepComplete}
            status={getStatus("Connect Wires")}
          />
        );

      case "Corner Calibration":
        return (
          <StepCornerCalibration
            handleStepComplete={handleStepComplete}
            status={getStatus("Corner Calibration")}
          />
        );

      case "Camera Calibration":
        return (
          <StepCameraCalibration
            handleStepComplete={handleStepComplete}
            status={getStatus("Camera Calibration")}
          />
        );

      case "Final Checklist":
        return (
          <StepFinalChecklist
            handleStepComplete={handleStepComplete}
            status={getStatus("Final Checklist")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute password="1234567890">
      <div className="flex flex-1 gap-4">
        {/* Sidebar */}
        <SidebarSteps
          steps={steps}
          selectedStep={selectedStep}
          onStepClick={setSelectedStep}
        />

        {/* Main step panel */}
        <div className="w-full bg-base-200 p-4 rounded">
          {renderStepComponent()}
        </div>

        {/* Terminal (commander lives here) */}
        <TerminalPanel ref={terminalRef} />
      </div>
    </ProtectedRoute>
  );
}
