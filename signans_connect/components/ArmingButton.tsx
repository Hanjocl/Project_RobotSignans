import { useState, useEffect, useRef, useCallback  } from 'react';
import { getConnectionStatus } from "../context/ConnectedContext";
import { getStepStatus } from "../context/StepsContext";

const ArmingButton = () => {
  const { state, setState, connected } = getConnectionStatus();
  const { steps } = getStepStatus();
  const [isPressed, setIsPressed] = useState(false);
  const [pendingResponse, setPendingResponse] = useState(false);
  const socketDraw = useRef<WebSocket | null>(null);

  const socket_cmd = useRef<WebSocket | null>(null);

  const sendCommand = useCallback((cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      socket_cmd.current.send(cmd);
    }
  }, []);

  // Move ResetESP32 here so it's accessible for the keydown handler
  const ResetESP32 = useCallback(() => {
    sendCommand('RESET');
    window.location.reload();
  }, [sendCommand]);

  useEffect(() => {
    // Connect to commander WebSocket
    socket_cmd.current = new WebSocket("ws://robosignans1:8000/ws/commander/");

    return () => {
      socket_cmd.current?.close();
    };
  }, []);

  useEffect(() => {
    // Listener for Escape key to reset ESP32
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        ResetESP32();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ResetESP32]);

  useEffect(() => {
    if (connected) {
      socketDraw.current = new WebSocket("ws://robosignans1:8000/ws/drawLoopArming/");

      socketDraw.current.onopen = () => {
        console.log("WebSocket connected.");
      };

      socketDraw.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setPendingResponse(false);
      };

      socketDraw.current.onmessage = (event) => {
        const state = event.data;
        setState(state);

        if (state === "Drawing") {
          setIsPressed(true);
        } else {
          setIsPressed(false);
        }

        setPendingResponse(false);
      };

      return () => {
        socketDraw.current?.close();
      };
    }
  }, [connected, setState]);

  const StartDrawingSequence = () => {
    if (socketDraw.current && socketDraw.current.readyState === WebSocket.OPEN) {
      if (pendingResponse) return;
      const action = !isPressed ? "TryStartDrawing" : "Stop";
      socketDraw.current.send(action);
      setPendingResponse(true);
    }
  };

  // Determine button styling
  let buttonClass = 'btn';
  let buttonText = '';

  const allStepsCompleted = steps.every(step => step.status === 'complete');

  if (!connected) {
    buttonClass = 'btn btn-disabled';
    buttonText = 'DISCONNECTED';
  } else if (!allStepsCompleted) {
    buttonClass = 'btn btn-disabled';
    buttonText = 'COMPLETE ALL STEPS';
  } else if (pendingResponse) {
    buttonClass = 'btn btn-warning';
    buttonText = 'FINISHING LAST MOVE...';
  } else if (isPressed) {
    buttonClass = 'btn btn-success';
    buttonText = state === 'Drawing' ? 'DRAWING' : 'ARM DRAWING';
  } else {
    buttonClass = 'btn btn-outline btn-neutral';
    buttonText = 'START DRAWING';
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={StartDrawingSequence}
        className={buttonClass}
        aria-disabled={!connected || pendingResponse || !allStepsCompleted}
      >
        {buttonText}
      </button>
      <button className="btn btn-outline" onClick={ResetESP32}>RESET</button>
      <button className="btn btn-error" onClick={() => sendCommand(`M112`)}>STOP</button>
    </div>
  );
};

export default ArmingButton;
