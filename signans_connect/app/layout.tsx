'use client';

import "./globals.css";
import { ConnectedProvider } from '../context/ConnectedContext';
import { StepsProvider } from "@/context/StepsContext";
import NavBar from "@/components/NavBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html data-theme="silk">
      <body>
        <ConnectedProvider>
          <StepsProvider>
            <div className="h-screen bg-base-100 text-base-content p-2 flex flex-col">
              <NavBar />
              {children}
            </div>
          </StepsProvider>
        </ConnectedProvider>
      </body>
    </html>
  );
}