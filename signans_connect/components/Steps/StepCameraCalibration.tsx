import React, { useState } from "react";

type StepCameraCalibrationProps = {
  handleStepComplete: (step: string) => void;
  relativeMove: (cmd:string) => void;
  status: string;
}

const StepCameraCalibration: React.FC<StepCameraCalibrationProps> = ({
  handleStepComplete, relativeMove
}) => {
  const [isCalibrated, setIsCalibrated] = useState(false);

  const handleMove = (axis: string, value: number) => {
    console.log(`Move ${axis}: ${value}`);
    // Replace this with robot movement logic
  };

  const handleCalibrate = () => {
    setIsCalibrated(true);
    handleStepComplete("Camera Calibration");
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Camera Calibration</h2>

      {/* CAMERA VIEW */}
      <div className="w-full max-w-lg mx-auto mb-6">
        <div className="border border-gray-500 bg-black rounded-md overflow-hidden aspect-video">
          {/* Replace with actual camera stream */}
          <p className="text-center text-white pt-24">[ Camera Feed Placeholder ]</p>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="flex justify-center gap-16 mb-6">
        {/* X and Y Axis Buttons */}
        <div className="flex flex-col items-center space-y-4">
          {/* +Y Axis Buttons */}
          <div className="flex flex-col items-center">
            <div className="flex flex-col space-y-2 mt-2">
              <button className="btn" onClick={() => relativeMove(`G0 Y10`)}>+10</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y5`)}>+5</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y1`)}>+1</button>
            </div>
          </div>

          {/* X Axis Buttons */}
          <div className="flex space-x-2 items-center">
            <button className="btn" onClick={() => relativeMove(`G0 X-10`)}>-10</button>
            <button className="btn" onClick={() => relativeMove(`G0 X-5`)}>-5</button>
            <button className="btn" onClick={() => relativeMove(`G0 X-1`)}>-1</button>
            <div className="w-16"></div> {/* Empty space in the center */}
            <button className="btn" onClick={() => relativeMove(`G0 X1`)}>+1</button>
            <button className="btn" onClick={() => relativeMove(`G0 X5`)}>+5</button>
            <button className="btn" onClick={() => relativeMove(`G0 X10`)}>+10</button>
          </div>

          {/* -Y Axis Buttons */}
          <div className="flex flex-col items-center">
            <div className="flex flex-col space-y-2 mt-2">
              <button className="btn" onClick={() => relativeMove(`G0 Y-1`)}>-1</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y-5`)}>-5</button>
              <button className="btn" onClick={() => relativeMove(`G0 Y-10`)}>-10</button>
            </div>
          </div>
        </div>

        {/* Z Axis Buttons (Side) */}
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

      {/* CALIBRATION BUTTON */}
      <div className="text-center">
        <button
          className="btn btn-outline"
          onClick={handleCalibrate}
          disabled={isCalibrated}
        >
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
      </div>
    </div>
  );
};

export default StepCameraCalibration;
