import React, { useState } from "react";

type StepHomingProps = {
  sendHomingCommand: (cmd: string) => void;
  handleStepComplete: (step: string) => void;
  status: string;
};

const StepHoming: React.FC<StepHomingProps> = ({
  sendHomingCommand,
  handleStepComplete,
  status,
}) => {
  // State to track whether each button has been pressed
  const [pressed, setPressed] = useState({
    X: false,
    Y: false,
    Z: false,
  });

  const handleButtonClick = (axis: string) => {
    //sendHomingCommand(`G28 ${axis.toUpperCase()}`);
    setPressed((prev) => ({
      ...prev,
      [axis]: true,
    }));
    alert(`G28 ${axis.toUpperCase()} has been send.\n\nDO NOT PRESS ANY OTHER BUTTONS UNTIL HOME SEQUENCE IS DONE.`);
  };

  return (
    <div className="h-full flex justify-center items-center">
      <div className="text-center">
        <h2 className="text-xl mb-4">Homing Step</h2>
        <div className="mb-4">
          <button
            className="btn btn-outline mb-2 mx-2"
            onClick={() => handleButtonClick("X")}
          >
            Home X
          </button>
          <button
            className="btn btn-outline mb-2 mx-2"
            onClick={() => handleButtonClick("Y")}
          >
            Home Y
          </button>
          <button
            className="btn btn-outline mb-2 mx-2"
            onClick={() => handleButtonClick("Z")}
          >
            Home Z
          </button>
        </div>
        <div>
          <button
            className="btn btn-outline mb-2 mx-2"
            onClick={() => handleStepComplete("Homing")}
            //disabled={!(pressed.X && pressed.Y && pressed.Z)}
          >
            Confirm homing
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepHoming;
