import React from 'react';
import { UserRole } from '@/lib/types';
import { LinkChainIcon, ExternalLinkIcon, CpuChipIcon, AlertCircleIcon, CheckCircleIcon } from './Icons';

interface OnChainAuditPanelProps {
  contractAddress: string;
  assetId: string;
  txStatus: string;
  isProcessing: boolean;
  isAuthenticated: boolean;
  userRole: UserRole;
  walletAddress: string | null;
  onContractAddressChange: (addr: string) => void;
  onAssetIdChange: (cid: string) => void;
  onExecuteLiveTx: () => void;
  onDeployContract?: () => void;
  isDeploying?: boolean;
}

export const OnChainAuditPanel: React.FC<OnChainAuditPanelProps> = ({
  contractAddress,
  assetId,
  txStatus,
  isProcessing,
  isAuthenticated,
  userRole,
  walletAddress,
  onContractAddressChange,
  onAssetIdChange,
  onExecuteLiveTx,
  onDeployContract,
  isDeploying = false,
}) => {
  const isAuditor = userRole.includes('Auditor');
  const isError = txStatus.toLowerCase().includes('error') || txStatus.toLowerCase().includes('revert') || txStatus.toLowerCase().includes('rejected');
  const isSuccess = txStatus.toLowerCase().includes('success') || txStatus.toLowerCase().includes('confirmed');

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-5">
      {/* Header - Shopeers B2B Style */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
            On-Chain Audit Execution
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            Polygon Amoy (EVM)
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          100% Real on-chain cryptographic access commit & NFT asset minting.
        </p>
      </div>

      <div className="space-y-4">
        {/* Smart Contract Registry Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Smart Contract Registry
            </label>
            {onDeployContract && (
              <button
                type="button"
                onClick={onDeployContract}
                disabled={isDeploying || isProcessing || !isAuthenticated}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline disabled:opacity-40 cursor-pointer inline-flex items-center gap-1"
                title="Deploy your own SentinelAuditRegistry.sol directly from your connected wallet"
              >
                <CpuChipIcon className="w-3 h-3" />
                <span>{isDeploying ? 'Deploying...' : 'Deploy New Registry'}</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => onContractAddressChange(e.target.value)}
            placeholder="0x... (Paste Deployed Sentinel Registry Address)"
            className={`w-full px-3.5 py-2.5 text-xs font-mono border rounded-xl bg-white focus:outline-none transition-all shadow-sm ${
              walletAddress && contractAddress && contractAddress.trim().toLowerCase() === walletAddress.trim().toLowerCase()
                ? 'border-amber-400 focus:ring-1 focus:ring-amber-500'
                : 'border-slate-200 focus:ring-1 focus:ring-slate-900'
            }`}
          />
          {walletAddress && contractAddress && contractAddress.trim().toLowerCase() === walletAddress.trim().toLowerCase() ? (
            <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-800 font-medium leading-tight">
                ⚠️ Your personal wallet address is entered here, not a smart contract.
              </span>
              <button
                type="button"
                onClick={() => onContractAddressChange('')}
                className="text-[11px] font-bold text-amber-950 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
              >
                Clear Field
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
              <span>Polygon Amoy (Chain ID 80002) smart contract registry.</span>
              <button
                type="button"
                onClick={() => onContractAddressChange('0x71C94bC817D1Ff8902898B677A016dAf3460A9C1')}
                className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
              >
                Use Demo Registry
              </button>
            </div>
          )}
        </div>

        {/* Asset Identifier Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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

        {/* Status Feedback Box */}
        {txStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs font-sans font-medium leading-relaxed break-all border transition-all ${
              isError
                ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                : isSuccess
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {isError ? (
                <AlertCircleIcon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : isSuccess ? (
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : null}
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isError ? 'Transaction Status / Error' : 'Blockchain Execution Status'}
              </span>
            </div>
            <span>{txStatus}</span>
          </div>
        )}

        {/* Primary On-Chain Transaction Button */}
        <button
          onClick={onExecuteLiveTx}
          disabled={isProcessing || !isAuthenticated || isAuditor}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LinkChainIcon className="w-3.5 h-3.5 text-slate-300" />
          <span>
            {isAuditor
              ? 'Auditor Mode (Read-Only)'
              : isProcessing
              ? 'Broadcasting to Polygon Amoy...'
              : isAuthenticated
              ? `Commit Log On-Chain as ${userRole.split(' ')[0]}`
              : 'Connect Wallet First'}
          </span>
        </button>

        {/* Faucet Link & Network Info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
          <span>Need testnet POL for gas?</span>
          <a
            href="https://faucet.polygon.technology/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 font-semibold underline hover:text-slate-700 inline-flex items-center gap-1"
          >
            <span>Claim Free POL</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
