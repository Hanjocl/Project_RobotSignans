"use client";  // This marks this file as a client component
import { useConnected } from "../context/ConnectedContext";

const StatusBar = () => {
  return (
    <div style={{
      position: 'sticky', 
      top: 0, 
      left: 0, 
      width: '100%', 
      padding: '10px', 
      backgroundColor: useConnected() ? 'green' : 'red', 
      color: 'white', 
      textAlign: 'center',
      fontWeight: 'bold'
    }}>
      {useConnected() ? 'Connected to ESP32' : 'Disconnected from ESP32'}
    </div>
  );
};

export default StatusBar;
