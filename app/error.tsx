'use client';

import React, { useEffect } from 'react';
import { AlertCircleIcon, ShieldIcon } from '@/components/Icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SentinelChain Runtime Error Caught by Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-lg space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircleIcon className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            Cryptographic Gateway Execution Exception
          </h2>
          <p className="text-xs text-slate-500">
            An unexpected error occurred during state execution or Web3 transaction orchestration.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-mono text-rose-700 break-all leading-relaxed">
          {error?.message || 'Unknown internal execution exception'}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            Reload Gateway
          </button>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Attempt State Recovery
          </button>
        </div>
      </div>
    </div>
  );
}
