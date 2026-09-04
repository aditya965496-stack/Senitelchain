import React from 'react';
import { ContractSystemStats } from '@/lib/contract';
import { RefreshIcon, ExternalLinkIcon, ShieldIcon, LinkChainIcon } from './Icons';

interface ContractStatusBannerProps {
  stats: ContractSystemStats | null;
  contractAddress: string;
  userRole: string;
  verifiedOnChainRole?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onTogglePause?: () => void;
  isAdmin?: boolean;
}

export const ContractStatusBanner: React.FC<ContractStatusBannerProps> = ({
  stats,
  contractAddress,
  userRole,
  verifiedOnChainRole,
  isLoading,
  onRefresh,
  onTogglePause,
  isAdmin = false,
}) => {
  const isContractSet = contractAddress && contractAddress.startsWith('0x') && contractAddress.length === 42;
  const isAvailable = stats?.isAvailable ?? false;
  const isPaused = stats?.isPaused ?? false;

  const formatAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-3.5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        {/* Contract Identity & Network */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <LinkChainIcon className="w-4 h-4 text-slate-100" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                Polygon Amoy On-Chain Registry
              </h3>
              {isContractSet && isAvailable ? (
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>LIVE (80002)</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  PENDING DEPLOYMENT
                </span>
              )}
              {isPaused && (
                <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full">
                  PAUSED
                </span>
              )}
            </div>
            {isContractSet ? (
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                <span>Contract: <strong className="text-slate-900">{formatAddress(contractAddress)}</strong></span>
                <a
                  href={`https://amoy.polygonscan.com/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                  title="View Contract on PolygonScan"
                >
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Paste contract address or deploy a new registry below.
              </p>
            )}
          </div>
        </div>

        {/* Action Controls: Refresh & Circuit Breaker */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isAdmin && isContractSet && isAvailable && onTogglePause && (
            <button
              onClick={onTogglePause}
              disabled={isLoading}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                isPaused
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
              }`}
              title="Admin Emergency Pause / Circuit Breaker"
            >
              {isPaused ? 'Unpause Registry' : 'Emergency Pause'}
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading || !isContractSet}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            title="Refresh on-chain metrics from Polygon Amoy"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Real On-Chain Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-0.5 text-slate-700">
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Digital Asset NFTs
          </span>
          <span className="text-lg font-bold font-mono text-slate-950 block mt-0.5">
            {stats ? stats.totalAssetsMinted.toLocaleString() : '—'}
          </span>
          <span className="text-[10px] text-slate-400 font-sans block">ERC-721 Total Minted</span>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Registered DIDs
          </span>
          <span className="text-lg font-bold font-mono text-slate-950 block mt-0.5">
            {stats ? stats.totalIdentities.toLocaleString() : '—'}
          </span>
          <span className="text-[10px] text-slate-400 font-sans block">W3C Identifiers</span>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Immutable Access Logs
          </span>
          <span className="text-lg font-bold font-mono text-slate-950 block mt-0.5">
            {stats ? stats.totalAccessLogs.toLocaleString() : '—'}
          </span>
          <span className="text-[10px] text-slate-400 font-sans block">On-Chain Audit Records</span>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active RBAC Privilege
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ShieldIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 truncate">
              {userRole.split(' ')[0]}
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-medium block">
            {verifiedOnChainRole ? 'Contract Verified' : 'Session Active'}
          </span>
        </div>
      </div>
    </div>
  );
};
