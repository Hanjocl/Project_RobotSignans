import React, { useState, useEffect, useRef } from "react";

type StepCameraCalibrationProps = {
  handleStepComplete: (step: string) => void;
  relativeMove: (cmd: string) => void;
  status: string;
};

type Coordinates = { X: number; Y: number; Z: number } | null;

const StepCameraCalibration: React.FC<StepCameraCalibrationProps> = ({
  handleStepComplete,
  relativeMove,
}) => {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [cameraCoords, setCameraCoords] = useState<Coordinates>(null);

  const socketRefCamera = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRefCamera.current = new WebSocket("ws://localhost:8000/ws/captureCameraPosition/");

    socketRefCamera.current.onopen = () => {
      console.log("Camera position socket connected");
    };

    socketRefCamera.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "captured" && data.positionName === "cameraPosition" && data.position) {
        setCameraCoords(data.position);
        setIsCalibrated(true);
        handleStepComplete("Camera Calibration");
      }

      if (data.status === "error" && data.message) {
        setIsCalibrated(false);
        console.error("Camera capture error:", data.message);
      }
    };

    return () => {
      socketRefCamera.current?.close();
    };
  }, []);

  const handleCapture = () => {
    if (socketRefCamera.current?.readyState === WebSocket.OPEN) {
      socketRefCamera.current.send(
        JSON.stringify({
          command: "capture",
          positionName: "cameraPosition",
        })
      );
    } else {
      console.error("WebSocket not open.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Camera Calibration</h2>

      {/* CAMERA VIEW */}
      <div className="w-full max-w-lg mx-auto mb-6">
        <div className="border border-gray-500 bg-black rounded-md overflow-hidden aspect-video">
          <p className="text-center text-white pt-24">[ Camera Feed Placeholder ]</p>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="flex justify-center gap-16 mb-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Y Axis */}
          <div className="flex flex-col items-center">
            <div className="flex flex-col space-y-2 mt-2">
              <button className="btn" onClick={() => relativeMove(`G0 Y10`)}>+10</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y5`)}>+5</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y1`)}>+1</button>
            </div>
          </div>

          {/* X Axis */}
          <div className="flex space-x-2 items-center">
            <button className="btn" onClick={() => relativeMove(`G0 X-10`)}>-10</button>
            <button className="btn" onClick={() => relativeMove(`G0 X-5`)}>-5</button>
            <button className="btn" onClick={() => relativeMove(`G0 X-1`)}>-1</button>
            <div className="w-16"></div>
            <button className="btn" onClick={() => relativeMove(`G0 X1`)}>+1</button>
            <button className="btn" onClick={() => relativeMove(`G0 X5`)}>+5</button>
            <button className="btn" onClick={() => relativeMove(`G0 X10`)}>+10</button>
          </div>

          {/* -Y Axis */}
          <div className="flex flex-col items-center">
            <div className="flex flex-col space-y-2 mt-2">
              <button className="btn" onClick={() => relativeMove(`G0 Y-1`)}>-1</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y-5`)}>-5</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y-10`)}>-10</button>
            </div>
          </div>
        </div>

        {/* Z Axis */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-md font-semibold">Z Axis</h3>
          <div className="flex flex-col space-y-2">
            <button className="btn" onClick={() => relativeMove(`G0 Z10`)}>+10</button>
            <button className="btn" onClick={() => relativeMove(`G0 Z5`)}>+5</button>
            <button className="btn" onClick={() => relativeMove(`G0 Z1`)}>+1</button>
            <button className="btn" onClick={() => relativeMove(`G0 Z-1`)}>-1</button>
            <button className="btn" onClick={() => relativeMove(`G0 Z-5`)}>-5</button>
            <button className="btn" onClick={() => relativeMove(`G0 Z-10`)}>-10</button>
          </div>
        </div>
      </div>

      {/* CALIBRATION & STATUS */}
      <div className="text-center">
        <button className="btn btn-outline" onClick={handleCapture}>
          Capture Position
        </button>

        <p className="mt-2">
          Status:{" "}
          {isCalibrated ? (
            <span className="text-success font-semibold">Complete</span>
          ) : (
            <span className="text-warning">In Progress</span>
          )}
        </p>

        {cameraCoords && (
          <div className="text-sm mt-2 text-gray-500">
            X: {cameraCoords.X.toFixed(1)} | Y: {cameraCoords.Y.toFixed(1)} | Z: {cameraCoords.Z.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepCameraCalibration;
