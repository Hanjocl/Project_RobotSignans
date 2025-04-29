"use client";  // This marks this file as a client component

import { useState, useEffect } from 'react';

const StatusBar = () => {
  const [connected, setConnected] = useState(false);

  // Connect to WebSocket server
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/status/");

    socket.onmessage = (event) => {
      const status = event.data === "True";  // Convert "true"/"false" to boolean
      setConnected(status);  // Update state with the boolean value
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
    <div style={{
      position: 'sticky', 
      top: 0, 
      left: 0, 
      width: '100%', 
      padding: '10px', 
      backgroundColor: connected ? 'green' : 'red', 
      color: 'white', 
      textAlign: 'center',
      fontWeight: 'bold'
    }}>
      {connected ? 'Connected to ESP32' : 'Disconnected from ESP32'}
    </div>
  );
};

export default StatusBar;
