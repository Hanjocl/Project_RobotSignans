'use client';
import React from "react";
import { useState, useEffect, useRef } from 'react';
import ProgressBar from '../components/ProgressBar';
import SidebarSteps from '../components/SidebarSteps';
import { getConnectionStatus } from "../context/ConnectedContext";
import { getStepStatus } from "../context/StepsContext";
import StepHoming from "@/components/Steps/StepHoming";
import StepConnectWires from "@/components/Steps/StepConnectWires";
import StepFinalChecklist from "@/components/Steps/StepFinalChecklist";
import StepCameraCalibration from "@/components/Steps/StepCameraCalibration";
import StepCornerCalibration from "@/components/Steps/StepCornerCalibration";


// pages/index.js
export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  const { state, connected } = getConnectionStatus();
  const { steps, socketSteps  } = getStepStatus();

  {/* Manual Input */}
  
  const [logs, setLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  
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

    return () => {
      socket_cmd.current?.close();
    };
  }, []);

  useEffect(() => {
  const lastLog = logs[logs.length - 1];
  if (lastLog && !lastLog.toLowerCase().includes("ok")) {
    setLoading(true);
  } else {
    setLoading(false);
  }
}, [logs]);

  // Handle manual input change
  const handleManualInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Manual Input Changed:", event.target.value);  // Log the input value for debugging
    setManualInput(event.target.value);
  };

  const sendManualCommand = (): void => {    
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN && !loading) {
      socket_cmd.current.send(manualInput);
      setManualInput('');
    } else if(loading) {
      console.log("Wait for next movement to complete");
    } 
    else {
      console.log("WebSocket is not open");
    }
  };
  

  const sendHomingCommand = (cmd: string) => {
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
        return <StepCameraCalibration handleStepComplete={handleStepComplete} relativeMove={sendRelativeMove} status={getStatus("Camera Calibration")} />;
      case "Final Checklist":
        return <StepFinalChecklist handleStepComplete={handleStepComplete} status={getStatus("Final Checklist")}/>;
      default:
        return <div>Select a step</div>;
    }
  };
  
  return (
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
              onChange={handleManualInputChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && connected && state !== "Drawing") {
                  sendManualCommand();
                } else if (event.key === 'Enter' && state === "Drawing") {
                  alert("Cannot send commands while drawing!");
                }
              }}
            />
            <button className={`btn justify-start w-1/5 ${!connected || loading ? 'btn-disabled' : 'btn-outline btn-error'}`}  onClick={() => state != "Drawing" ? sendManualCommand() : alert("Cannot send commands while drawing!") }>Send</button>
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
              <button className="btn btn-sm btn-info w-1/6" onClick={() => state != "Drawing" ? sendHomingCommand(`G28 ${axis}`) : alert("Cannot send commands while drawing!") } >home </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}