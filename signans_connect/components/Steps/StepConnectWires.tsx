import React from "react";

type StepConnectWiresProps = {
  handleStepComplete: (step: string) => void;
  status: string;
};

const StepConnectWires: React.FC<StepConnectWiresProps> = ({ handleStepComplete, status }) => {
  // Conditional class names for the status text
  const statusClass = status === "complete" ? "text-green-500" : status === "pending" ? "text-yellow-500" : "";

  return (
    <div className="f-full flex flex-col justify-center items-center space-y-4">
      <h2 className="text-xl font-semibold">Please confirm that the cables are connected</h2>
      <p className="text-lg">
        Status: <span className={`font-semibold ${statusClass}`}>{status === "complete" ? "Complete" : status === "pending" ? "Pending" : ""}</span>
      </p>
      <button className="btn px-6 py-2 bg-blue-500 text-white rounded" onClick={() => handleStepComplete("Connect Wires")}>
        Confirm
      </button>
    </div>
  );
};

export default StepConnectWires;
