import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { WS_ENDPOINTS } from "@/context/WebSockets";


// Define the context types for steps state
export type StepStatus = {
  step: string;
  status: 'pending' | 'complete';
};

interface StepsContextType {
  steps: StepStatus[];
  setSteps: React.Dispatch<React.SetStateAction<StepStatus[]>>;
  socketSteps: WebSocket | null; // Add the WebSocket reference
}

const StepsContext = createContext<StepsContextType | undefined>(undefined);

export const StepsProvider = ({ children }: { children: React.ReactNode }) => {
  const [steps, setSteps] = useState<StepStatus[]>([
    { step: 'Homing', status: 'pending' },
    { step: 'Connect Wires', status: 'pending' },
    { step: 'Corner Calibration', status: 'pending' },
    { step: 'Camera Calibration', status: 'pending' },
    { step: 'Final Checklist', status: 'pending' },
  ]);

  const socketSteps = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketSteps.current = new WebSocket(WS_ENDPOINTS.steps);

    socketSteps.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSteps((prevSteps) => {
        const updatedSteps = prevSteps.map((s) =>
          s.step === data.step ? { ...s, status: data.status } : s
        );
        return updatedSteps;
      });
    };

    return () => {
      socketSteps.current?.close();
    };
  }, []);

  return (
    <StepsContext.Provider value={{ steps, setSteps, socketSteps: socketSteps.current }}>
      {children}
    </StepsContext.Provider>
  );
};

// Custom hook to use StepsContext
export const getStepStatus = (): StepsContextType => {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error('useStepsContext must be used within a StepsProvider');
  }
  return context;
};
