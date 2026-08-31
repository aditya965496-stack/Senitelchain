import React from 'react';
import { UserRole } from '@/lib/types';
import { DEFAULT_CONTRACT_ADDRESS } from '@/lib/contract';

interface OnChainAuditPanelProps {
  contractAddress: string;
  assetId: string;
  txStatus: string;
  isProcessing: boolean;
  isAuthenticated: boolean;
  userRole: UserRole;
  onContractAddressChange: (addr: string) => void;
  onAssetIdChange: (cid: string) => void;
  onExecuteLiveTx: () => void;
  onExecuteDemoTx: () => void;
}

export const OnChainAuditPanel: React.FC<OnChainAuditPanelProps> = ({
  contractAddress,
  assetId,
  txStatus,
  isProcessing,
  isAuthenticated,
  userRole,
  onContractAddressChange,
  onAssetIdChange,
  onExecuteLiveTx,
  onExecuteDemoTx,
}) => {
  const isAuditor = userRole.includes('Auditor');

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
            On-Chain Audit Execution
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Polygon Amoy (EVM)
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Commit cryptographic access state to smart contract registry.
        </p>
      </div>

      <div className="space-y-4">
        {/* Smart Contract Registry Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Smart Contract Registry
            </label>
            <button
              type="button"
              onClick={() => onContractAddressChange(DEFAULT_CONTRACT_ADDRESS)}
              className="text-[11px] text-slate-600 hover:text-slate-950 underline font-medium cursor-pointer"
            >
              Use Default Registry
            </button>
          </div>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => onContractAddressChange(e.target.value)}
            placeholder="0x..."
            className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
          />
        </div>

        {/* Asset Identifier Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Asset Identifier (CID Hash)
          </label>
          <input
            type="text"
            value={assetId}
            onChange={(e) => onAssetIdChange(e.target.value)}
            placeholder="Auto-populated from IPFS storage..."
            className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
          />
        </div>

        {/* Terminal Status Feedback Box */}
        {txStatus && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 leading-relaxed break-all shadow-inner">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Execution Status</span>
            {txStatus}
          </div>
        )}

        {/* Primary On-Chain Transaction Button */}
        <button
          onClick={onExecuteLiveTx}
          disabled={isProcessing || !isAuthenticated || isAuditor}
          className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>⛓️</span>
          <span>
            {isAuditor
              ? 'Auditor Mode (Read-Only)'
              : isProcessing
              ? 'Broadcasting On-Chain...'
              : isAuthenticated
              ? `Commit Log as ${userRole.split(' ')[0]}`
              : 'Connect Wallet First'}
          </span>
        </button>

        {/* Fast Demo Mode Button & Faucet Link */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onExecuteDemoTx}
            disabled={isProcessing || isAuditor}
            className="w-full py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl text-xs font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2 border border-slate-200 shadow-sm cursor-pointer"
          >
            <span>⚡</span>
            <span>Fast Demo: Simulate On-Chain Commit</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
            <span>Need Polygon Amoy POL?</span>
            <a
              href="https://faucet.polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900 font-semibold underline hover:text-slate-700 inline-flex items-center gap-0.5"
            >
              Claim Free POL ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
