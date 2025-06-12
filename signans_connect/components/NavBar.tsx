'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ArmingButton from './ArmingButton';
import { getConnectionStatus } from '../context/ConnectedContext';

export default function NavBar() {
  const pathname = usePathname();
  const isActive = (tab: string) => pathname.startsWith(`/${tab.toLowerCase()}`);

  const ConnectedStatus = () => {
  const { connected, state } = getConnectionStatus();

  // Determine styles based on state
  let colorClass = 'bg-error text-white'; // default error
  if (state === 'Error') {
    colorClass = 'bg-warning text-black'; // warning colors, e.g. yellow bg with black text
  } else if (state === 'True') {
    colorClass = 'bg-success text-white'; // success colors
  }

  return (
    <div className={`flex-1 btn justify-start ${colorClass}`}>
      {state === 'Error'
        ? 'Warning: Check Connection'
        : connected
        ? 'Connected to ESP32'
        : 'Connecting...'}
    </div>
  );
};

  return (
    <div className="navbar shadow-lg flex space-x-2 mb-4">
      <div role="tablist" className="tabs tabs-box w-1/5">
        <Link href="/setup" role="tab" className={`tab w-1/3 ${isActive('setup') ? 'tab-active' : ''}`}>
          SETUP
        </Link>
        <Link href="/overview" role="tab" className={`tab w-1/3 ${isActive('overview') ? 'tab-active' : ''}`}>
          MONITOR
        </Link>
        <Link href="/camera" role="tab" className={`tab w-1/3 ${isActive('camera') ? 'tab-active' : ''}`}>
          CAMERA
        </Link>
      </div>

      <ConnectedStatus />
      <ArmingButton />
    </div>
  );
}
