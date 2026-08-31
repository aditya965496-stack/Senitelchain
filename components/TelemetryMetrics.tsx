import React from 'react';
import { TelemetryStats } from '@/lib/types';

interface TelemetryMetricsProps {
  telemetry: TelemetryStats;
}

export const TelemetryMetrics: React.FC<TelemetryMetricsProps> = ({ telemetry }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
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
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="block text-[10px] font-semibold text-slate-500 uppercase">
            Encryption Latency
          </span>
          <span className="text-lg font-mono font-bold text-slate-950 mt-1 block">
            {telemetry.encryptionLatencyMs !== null
              ? `${telemetry.encryptionLatencyMs} ms`
              : 'Awaiting Execution'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
            {telemetry.cipherAlgorithm}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="block text-[10px] font-semibold text-slate-500 uppercase">
            Payload Memory Footprint
          </span>
          <span className="text-lg font-mono font-bold text-slate-950 mt-1 block">
            {telemetry.payloadFootprintBytes !== null
              ? `${(telemetry.payloadFootprintBytes / 1024).toFixed(2)} KB`
              : 'Awaiting Ingestion'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
            Zero-Knowledge In-Memory Buffer
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="block text-[10px] font-semibold text-slate-500 uppercase">
            Gas Consumed (Polygon Amoy)
          </span>
          <span className="text-lg font-mono font-bold text-slate-950 mt-1 block">
            {telemetry.gasUsed || 'Awaiting Transaction'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
            EVM Execution Footprint
          </span>
        </div>
      </div>
    </div>
  );
};
