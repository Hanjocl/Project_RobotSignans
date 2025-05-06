import { useState, useEffect, useRef } from 'react';

type StepCornerCalibrationProps = {
  handleStepComplete: (step: string) => void;
  status: string;
};

type PositionStatus = "pending" | "captured" | "error";
type Coordinates = { X: number; Y: number; Z: number } | null;

const StepCornerCalibration: React.FC<StepCornerCalibrationProps> = ({
  handleStepComplete,
  status
}) => {
  // State to keep track of each corner's status (pending, captured, or error)
  const [positionsStatus, setPositionsStatus] = useState<Record<number, PositionStatus>>({
    0: "pending", 1: "pending", 2: "pending", 3: "pending"
  });

  // State to store the captured coordinates for each position
  const [capturedPositions, setCapturedPositions] = useState<Record<number, Coordinates>>({
    0: null, 1: null, 2: null, 3: null
  });

  // WebSocket reference
  const socketRef = useRef<WebSocket | null>(null);

  const positionNames = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
  const classMap = [
    "absolute top-0 left-0 m-2",
    "absolute top-0 right-0 m-2",
    "absolute bottom-0 left-0 m-2",
    "absolute bottom-0 right-0 m-2"
  ];

  // Use effect to handle WebSocket connection and communication
  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws/captureCornerPosition/");

    socketRef.current.onopen = () => {
      console.log("Corner position socket connected");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "captured" && data.positionName && data.position) {
        const index = positionNames.indexOf(data.positionName);
        if (index !== -1) {
          const coordObject = {
            X: data.position[0],
            Y: data.position[1],
            Z: data.position[2],
          };
          updatePosition(index, coordObject);
        }
      }

      if (data.status === "error" && data.message) {
        console.error(data.message);
      }
      console.log(data.position[2])
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);

  // Update position state when a position is captured
  const updatePosition = (index: number, coords: Coordinates) => {
    setPositionsStatus((prevStatus) => ({
      ...prevStatus,
      [index]: "captured"  // Mark the button as captured
    }));

    setCapturedPositions((prevPositions) => ({
      ...prevPositions,
      [index]: coords  // Save the coordinates for this position
    }));
  };

  // Request position capture from the backend
  const requestCapture = (index: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          command: "capture",
          positionName: positionNames[index],
        })
      );
    } else {
      // Handle WebSocket not open (error case)
      setPositionsStatus((prevStatus) => ({
        ...prevStatus,
        [index]: "error"  // Set the button state to error
      }));
    }
  };

  const handleCapture = () => {
    if (Object.values(capturedPositions).every((position) => position !== null)) {
      console.log("All positions captured. Completing Corner Calibration...");
      handleStepComplete("Corner Calibration");
    } else {
      alert("Not all positions were captured")
    }
  };

  // Get button color based on the position status
  const getButtonColor = (status: PositionStatus) => {
    switch (status) {
      case "captured":
        return "btn-success"; // Green button for captured position
      case "error":
        return "btn-error"; // Red button for error
      default:
        return "btn-warning"; // Yellow button for pending
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Corner Calibration</h2>
      <div className="relative w-1/2 aspect-square border border-gray-400 mx-auto bg-base-200 rounded-md">
        {positionNames.map((name, index) => {
          const coords = capturedPositions[index];
          return (
            <div key={name} className={`${classMap[index]} flex flex-col items-center justify-center`}>
              {/* Name text */}
              <span className="text-md font-semibold text-gray-700">{name}</span>
              
              {/* Display the coordinates or a placeholder message */}
              <div className="text-xs mt-1 text-gray-500 text-center">
                {coords ? (
                  <>
                  X: {coords.X != null ? coords.X.toFixed(2) : 'N/A'} |
                  Y: {coords.Y != null ? coords.Y.toFixed(2) : 'N/A'} |
                  Z: {coords.Z != null ? coords.Z.toFixed(1) : 'N/A'}
                </>
                ) : (
                  <span className="text-gray-400">No coordinates set yet</span>
                )}
              </div>

              {/* Capture position button */}
              <button
                className={`btn btn-sm ${getButtonColor(positionsStatus[index])}`}
                onClick={() => requestCapture(index)}
              >
                Capture Position
              </button>

            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center">
        Status:{" "}
        {status == "captured" ? (
          <span className="text-success font-semibold">Complete</span>
        ) : (
          <span className="text-warning">In Progress</span>
        )}
      </p>

      {/* CALIBRATION & STATUS */}
      <div className="text-center mt-6">
        <button className="btn btn-outline" onClick={handleCapture}>
          Capture Position
        </button>

        <p className="mt-2">
          Status:{" "}
          {status === "captured" ? (
            <span className="text-success font-semibold">Complete</span>
          ) : (
            <span className="text-warning">In Progress</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default StepCornerCalibration;
