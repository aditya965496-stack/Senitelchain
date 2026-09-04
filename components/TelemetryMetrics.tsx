import React from 'react';
import { TelemetryStats } from '@/lib/types';
import { CpuChipIcon, FileTextIcon, LinkChainIcon } from './Icons';

interface TelemetryMetricsProps {
  telemetry: TelemetryStats;
}

export const TelemetryMetrics: React.FC<TelemetryMetricsProps> = ({ telemetry }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-4">
      {/* Header - Shopeers B2B Style */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Zero-Trust Telemetry & Cryptographic Benchmarks
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time local hardware performance and EVM gas consumption.
          </p>
        </div>
        <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-mono flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          REAL-TIME TELEMETRY
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Metric Card 1 */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Encryption Latency
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs">
              <CpuChipIcon className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <span className="text-xl font-mono font-bold text-slate-950 block">
            {telemetry.encryptionLatencyMs !== null
              ? `${telemetry.encryptionLatencyMs} ms`
              : 'Awaiting Execution'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
            {telemetry.cipherAlgorithm}
          </span>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Payload Footprint
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs">
              <FileTextIcon className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <span className="text-xl font-mono font-bold text-slate-950 block">
            {telemetry.payloadFootprintBytes !== null
              ? `${(telemetry.payloadFootprintBytes / 1024).toFixed(2)} KB`
              : 'Awaiting Ingestion'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
            Zero-Knowledge In-Memory Buffer
          </span>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gas Consumed
            </span>
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs">
              <LinkChainIcon className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <span className="text-xl font-mono font-bold text-slate-950 block">
            {telemetry.gasUsed || 'Awaiting Transaction'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
            Polygon Amoy (80002)
          </span>
        </div>
      </div>
    </div>
  );
};
