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
        const coordObject = {
          X: data.position[0],
          Y: data.position[1],
          Z: data.position[2],
        };
        setCameraCoords(coordObject);
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
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Left Column */}
      <div className="flex flex-col justify-between">
        {/* CAMERA VIEW */}
        <div className="flex bg-base-200">
          <div className="border border-base-content rounded-box p-4">
            <h2 className="text-lg font-bold mb-4 text-center">Live Camera Feed</h2>
            <div className="aspect-w-16 aspect-h-9">
              <img
                src="http://localhost:8000/video"
                alt="Live Stream"
                className="rounded-box shadow-xl object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column (divided into top and bottom) */}
      <div className="grid grid-rows-2 gap-4 h-full">
        {/* Top Section of the Right Column */}
        <div className="flex flex-col">
          {/* CONTROL PANEL */}
      <div className="flex justify-center gap-16">
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
        </div>
        
        {/* Bottom Section of the Right Column */}
        <div className="flex flex-col">
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

            {cameraCoords ? (
              <div className="text-sm mt-2 text-gray-500">
                X: {cameraCoords.X?.toFixed(1)} | Y: {cameraCoords.Y?.toFixed(1)} | Z: {cameraCoords.Z?.toFixed(1)}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Camera position not captured yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepCameraCalibration;


// <div>
//       {/* LAYOUT: camera + control panel side by side */}
//       <div className="flex flex-col lg:flex-row justify-center items-start gap-8 mb-6">

      

      

      
//     </div>