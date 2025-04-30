import { useState, useEffect, useRef } from 'react';
import { getContext } from "../context/ConnectedContext";

const ArmingButton = () => {
  const { state, setState, connected } = getContext();
  const [isPressed, setIsPressed] = useState(false);
  const [pendingResponse, setPendingResponse] = useState(false); // New state for waiting period
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (connected) {
      socketRef.current = new WebSocket("ws://localhost:8000/ws/drawLoopArming/");

      socketRef.current.onopen = () => {
        console.log("WebSocket connected.");
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setPendingResponse(false); // Stop pending if there's an error
      };

      socketRef.current.onmessage = (event) => {
        const state = event.data;

        setState(event.data);

        if (state === "Drawing") {
          setIsPressed(true);
        } else {
          setIsPressed(false);
        } 

        setPendingResponse(false); // Clear pending state when response is received
      };

      return () => {
        socketRef.current?.close();
      };
    }
  }, [connected]);

  const StartDrawingSequence = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      if (pendingResponse) return
      const action = !isPressed ? "TryStartDrawing" : "Stop";
      socketRef.current.send(action);
      setPendingResponse(true); // Start waiting for server response
    }
  };

  // Determine button styling
  let buttonClass = 'btn';
  let buttonText = '';

  if (!connected) {
    buttonClass = 'btn btn-disabled';
    buttonText = 'DISCONNECTED';
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

  const socket_cmd = useRef<WebSocket | null>(null);
  useEffect(() => {
      // Connect to WebSocket server
      socket_cmd.current= new WebSocket("ws://localhost:8000/ws/commander/");
  
      socket_cmd.current.onmessage = (event) => {
      };
  
      socket_cmd.current.onclose = () => {
      };
  
      return () => {
        socket_cmd.current?.close();
      };
    }, []);

  const sendCommand = (cmd: string) => {
    if (socket_cmd.current && socket_cmd.current.readyState === WebSocket.OPEN) {
      socket_cmd.current.send(cmd);
    }
  };

  return (
    <div>
      <button
        onClick={StartDrawingSequence}
        className={buttonClass}
        aria-disabled={!connected || pendingResponse}
      >
        {buttonText}
      </button>
      <button className='btn btn-error' onClick={() => sendCommand(`M112`)}>STOP</button>
    </div>
  );
};

export default ArmingButton;
