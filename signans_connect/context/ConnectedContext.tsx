// context/ConnectedContext.tsx
'use client'; // If you're using the App Router (Next.js 13+)

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the context type
interface ConnectedContextType {
  connected: boolean;
  setConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create context with default value of `undefined`
const ConnectedContext = createContext<ConnectedContextType | undefined>(undefined);

export const ConnectedProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket server
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/status/");

    socket.onmessage = (event) => {
      const status = event.data === "True";
      setConnected(status);
    };

    // Handle WebSocket errors
    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    // Cleanup WebSocket on component unmount
    return () => {
      socket.close();
    };
  }, []);

  return (
    <ConnectedContext.Provider value={{ connected, setConnected }}>
      {children}
    </ConnectedContext.Provider>
  );
};

export const useConnected = (): ConnectedContextType => {
  const context = useContext(ConnectedContext);
  if (!context) {
    throw new Error('useConnected must be used within a ConnectedProvider');
  }
  return context;
};
