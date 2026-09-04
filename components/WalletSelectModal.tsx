'use client';

import React, { useState, useEffect } from 'react';
import { getSupportedWallets, WalletInfo, SupportedWalletId } from '@/lib/wallets';
import { CloseIcon, ShieldIcon } from './Icons';

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: SupportedWalletId) => void;
  isProcessing: boolean;
}

export const WalletSelectModal: React.FC<WalletSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectWallet,
  isProcessing,
}) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setWallets(getSupportedWallets());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShieldIcon className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Connect Web3 Wallet</h3>
              <p className="text-[11px] text-slate-500 font-medium">Select provider for Polygon Amoy DID session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            title="Close"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Wallet Options List */}
        <div className="p-5 space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => {
                if (wallet.isInstalled) {
                  onSelectWallet(wallet.id);
                } else {
                  window.open(wallet.downloadUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                wallet.isInstalled
                  ? 'border-slate-200 hover:border-slate-900 hover:bg-slate-50/80 shadow-2xs hover:shadow-xs'
                  : 'border-dashed border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Custom Branded Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs bg-white">
                  {wallet.id === 'metamask' && (
                    <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                      <path
                        d="M28.09 3.52L17.72 11.23l2.05-4.87L28.09 3.52zM3.91 3.52l10.29 7.73-2-4.89L3.91 3.52zM24.28 22.3l-2.73 4.19 6.27 1.72 1.8-6.19-5.34.28zM7.72 22.3l2.73 4.19-6.27 1.72-1.8-6.19 5.34.28z"
                        fill="#E2761B"
                      />
                      <path
                        d="M10.45 26.49l3.41-1.68-2.95-2.29-.46 3.97zm11.1 0l-3.41-1.68 2.95-2.29.46 3.97zM26.24 16.29l-3.03-.89.98-2.67 3.32.22-1.27 3.34zM5.76 16.29l3.03-.89-.98-2.67-3.32.22 1.27 3.34z"
                        fill="#E4761B"
                      />
                      <path
                        d="M16 19.55l3.8-2.38-2.93-2.37H15.13l-2.93 2.37 3.8 2.38z"
                        fill="#D7C1B3"
                      />
                      <path
                        d="M21.55 13.91l2.77-1.12-4.5-5.91-2.05 4.87 3.78 2.16zM10.45 13.91l-2.77-1.12 4.5-5.91 2 4.89-3.73 2.14z"
                        fill="#233447"
                      />
                    </svg>
                  )}
                  {wallet.id === 'rabby' && (
                    <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="8" fill="#8697FF" />
                      <path
                        d="M9 22C9 17.5817 12.5817 14 17 14H23V22C23 22.5523 22.5523 23 22 23H10C9.44772 23 9 22.5523 9 22Z"
                        fill="white"
                      />
                      <circle cx="14.5" cy="18.5" r="1.5" fill="#8697FF" />
                      <circle cx="19.5" cy="18.5" r="1.5" fill="#8697FF" />
                      <path
                        d="M13 14V10C13 8.89543 13.8954 8 15 8C16.1046 8 17 8.89543 17 10V14"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18 14V11C18 9.89543 18.8954 9 20 9C21.1046 9 22 9.89543 22 11V14"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {wallet.id === 'trust' && (
                    <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="8" fill="#0500FF" />
                      <path
                        d="M16 7L24 10.5V17C24 21.5 20.5 25.5 16 26.5C11.5 25.5 8 21.5 8 17V10.5L16 7Z"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 11V22M16 11L12.5 14M16 11L19.5 14"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Name & Description */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {wallet.name}
                    </span>
                    {wallet.id === 'metamask' && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-sans font-medium px-1.5 py-0.5 rounded border border-amber-200">
                        Default EVM
                      </span>
                    )}
                    {wallet.id === 'rabby' && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-sans font-medium px-1.5 py-0.5 rounded border border-indigo-200">
                        Zero-Trust Simulation
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    {wallet.description}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 pl-2">
                {wallet.isInstalled ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 group-hover:bg-emerald-100 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Ready</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                    Install
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Multi-wallet connection powered by <strong>EIP-6963</strong> standard. Your private keys never leave your secure wallet extension.
          </p>
        </div>
      </div>
    </div>
  );
};
