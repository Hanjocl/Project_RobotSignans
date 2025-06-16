import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the context types for connected state
interface ConnectedContextType {
  connected: boolean;
  setConnected: React.Dispatch<React.SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
}

const ConnectedContext = createContext<ConnectedContextType | undefined>(undefined);

// Provider for connection-related state
export const ConnectedProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<string>('idle');

  // Connect to WebSocket server for connection status
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/connectionStatus/");

    socket.onmessage = (event) => {
      const status = event.data === "True";
      setConnected(status);
      setState(event.data)
    };

    // Handle WebSocket errors
    socket.onerror = (error) => {
      setConnected(false)
      setState("Error")
      console.error('WebSocket Error:', error);
    };

    // Cleanup WebSocket on component unmount
    return () => {
      socket.close();
    };
  }, []);

  return (
    <ConnectedContext.Provider value={{ connected, setConnected, state, setState }}>
      {children}
    </ConnectedContext.Provider>
  );
};

// Custom hook to use ConnectedContext
export const getConnectionStatus = (): ConnectedContextType => {
  const context = useContext(ConnectedContext);
  if (!context) {
    throw new Error('useConnectedContext must be used within a ConnectedProvider');
  }
  return context;
};