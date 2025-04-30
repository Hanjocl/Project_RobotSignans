'use client';

import "./globals.css";
import { useState, useEffect, useRef} from 'react';
import { ConnectedProvider } from '../context/ConnectedContext';
import { getContext } from "../context/ConnectedContext";
import ArmingButton from '../components/ArmingButton';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ConnectedStatus = () => {
    const { connected } = getContext(); // Access context here

    return (
      <div className={`flex-1 btn justify-start ${connected ? 'bg-success text-white' : 'bg-error text-white'}`}>
        {connected ? 'Connected to ESP32' : 'Connecting...'}
      </div>
    );
  }

  return (
    <html data-theme="silk">
      <body >
        <ConnectedProvider>
          <div className="h-screen bg-base-100 text-base-content p-2 flex flex-col ">
            {/* Top Navigation */}
            <div className="navbar shadow-lg flex space-x-2 mb-4">
              
              <div role="tablist" className="tabs tabs-box w-1/5">
                <a role="tab" className="tab w-1/3 tab-active">OVERVIEW</a>
                <a role="tab" className="tab w-1/3">SETUP</a>
                <a role="tab" className="tab w-1/3">CAMERA</a>
              </div> 
                
              {/* Access context value */}
              <ConnectedStatus />
              
              {/* Arming Button */}
              <ArmingButton />
            </div>
            {/* Rest of Page */}
            {children}
          </div>
        </ConnectedProvider>
      </body>
    </html>
  )
}

