import React from 'react';
import { UserRole } from '@/lib/types';
import { ShieldIcon, WalletIcon } from './Icons';

interface NavbarProps {
  walletAddress: string | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  isProcessing: boolean;
  connectedWalletType?: string;
  onRoleChange: (role: UserRole) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
  onOpenDIDModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  walletAddress,
  isAuthenticated,
  userRole,
  isProcessing,
  connectedWalletType,
  onRoleChange,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  onOpenDIDModal,
}) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/80">
      {/* Brand Identity - Shopeers B2B Style */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.15)] border border-slate-800">
          <ShieldIcon className="w-5 h-5 text-slate-100" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-slate-950 font-sans">
              SentinelChain
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-sans px-2.5 py-0.5 rounded-full font-medium border border-slate-200">
              v3.0 Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Zero-Trust Access Control & DID Audit Verification
          </p>
        </div>
      </div>

      {/* Action Controls & Wallet Integration */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Network Indicator / 1-Click Switcher */}
        <button
          onClick={onSwitchNetwork}
          title="Click to switch wallet to Polygon Amoy Testnet (Chain ID 80002)"
          className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-800">Polygon Amoy</span>
          <span className="text-[11px] font-sans text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 tabular-nums">
            80002
          </span>
        </button>

        {walletAddress && isAuthenticated ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white border border-slate-200/90 px-3 py-2 rounded-xl text-slate-700 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <strong className="text-slate-900">{formatAddress(walletAddress)}</strong>
              {connectedWalletType && (
                <span className="text-[11px] text-indigo-700 bg-indigo-50 font-sans font-medium px-2 py-0.5 rounded border border-indigo-200">
                  {connectedWalletType}
                </span>
              )}
              <span className="text-[11px] text-slate-700 bg-slate-100 font-sans font-medium px-2 py-0.5 rounded-md border border-slate-200/50">
                {userRole.split(' ')[0]}
              </span>
            </span>

            {onOpenDIDModal && (
              <button
                onClick={onOpenDIDModal}
                title="Inspect W3C DID Document & Credential Proofs"
                className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                DID Doc
              </button>
            )}

            <button
              onClick={onDisconnect}
              className="text-xs font-medium text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200/90 px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-medium border border-slate-200/90 rounded-xl bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-sm hover:border-slate-300 cursor-pointer"
            >
              <option value="Admin (Issuer)">Admin (Issuer)</option>
              <option value="Manager (Asset Manager)">Manager (Asset Manager)</option>
              <option value="Auditor (Viewer - Read Only)">Auditor (Viewer - Read Only)</option>
              <option value="User (Asset Owner)">User (Asset Owner)</option>
            </select>

            <button
              onClick={onConnect}
              disabled={isProcessing}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <WalletIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>{isProcessing ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
