import React, { useState } from "react";

// Define the checklist item type
type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
};

type StepFinalChecklistProps = {
  handleStepComplete: (step: string) => void;
  status: string;
};

const StepFinalChecklist: React.FC<StepFinalChecklistProps> = ({ handleStepComplete, status }) => {
  // Initialize the checklist items state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, text: "Has homed", completed: false },
    { id: 2, text: "Cables are Connected", completed: false },
    { id: 3, text: "Tested all axis", completed: false },
    { id: 4, text: "Veried Corner Calibration", completed: false },
    { id: 5, text: "Veried Camera Calibration", completed: false },
    { id: 6, text: "Final review", completed: false },
  ]);

  // Handle the toggle of a checklist item
  const handleToggleItem = (id: number) => {
    setChecklist((prevChecklist) =>
      prevChecklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const allChecked = checklist.every(item => item.completed);

  return (
    <div className="bg-base-200 p-4 rounded">
      <h2 className="text-2xl font-semibold mb-4">Final Checklist</h2>
      <p className="mb-4">Status: <span className={`text-${status === 'pending' ? 'warning' : 'success'}-500`}>{status}</span></p>
      <ul className="space-y-2">
        {checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggleItem(item.id)}
              className={`checkbox
                ${item.completed ? "checkbox-success" : "checkbox-neutral"}`}
            />
            <span
              className={`w-1/3
                ${item.completed
                  ? "bg-green-500 text-white p-2 rounded"
                  : "bg-yellow-500 text-black p-2 rounded"
              }`}
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
      <button
        className="btn btn-outline btn-outline mt-4 w-full"
        onClick={() => handleStepComplete("Final Checklist")}
        disabled={!allChecked}
      >
        Complete Step
      </button>
    </div>
  );
};

export default StepFinalChecklist;
