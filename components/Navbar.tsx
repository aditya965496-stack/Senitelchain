import React from 'react';
import { UserRole } from '@/lib/types';

interface NavbarProps {
  walletAddress: string | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  isProcessing: boolean;
  onRoleChange: (role: UserRole) => void;
  onConnect: () => void;
  onDemoConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  walletAddress,
  isAuthenticated,
  userRole,
  isProcessing,
  onRoleChange,
  onConnect,
  onDemoConnect,
  onDisconnect,
  onSwitchNetwork,
}) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-bold text-lg shadow-md border border-slate-800">
          🛡️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-slate-950">SentinelChain</span>
            <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded-full font-bold">
              PROD v2.4
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Zero-Trust Access Control & Audit Verification</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Network Indicator / 1-Click Switcher */}
        <button
          onClick={onSwitchNetwork}
          title="Click to switch wallet to Polygon Amoy Testnet (Chain ID 80002)"
          className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold">Polygon Amoy</span>
          <span className="text-[10px] font-mono text-slate-400">80002</span>
        </button>

        {walletAddress && isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-700 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <strong>{formatAddress(walletAddress)}</strong>
              <span className="text-[11px] text-slate-600 bg-slate-100 font-sans font-medium px-2 py-0.5 rounded-md">
                {userRole.split(' ')[0]}
              </span>
            </span>
            <button
              onClick={onDisconnect}
              className="text-xs font-medium text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 px-3 py-2 rounded-xl transition-all shadow-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-medium border border-slate-200 rounded-xl bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-sm cursor-pointer"
            >
              <option value="Admin (Issuer)">Admin (Issuer)</option>
              <option value="Officer (Requester)">Officer (Requester)</option>
              <option value="Auditor (Viewer - Read Only)">Auditor (Viewer - Read Only)</option>
            </select>

            <button
              onClick={onConnect}
              disabled={isProcessing}
              className="text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>🦊</span>
              <span>{isProcessing ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>

            <button
              onClick={onDemoConnect}
              title="Quick Demo Mode without MetaMask extension"
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-all border border-slate-200"
            >
              ⚡ Demo Identity
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
