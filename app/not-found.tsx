import Link from 'next/link';
import { ShieldIcon } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6 text-slate-900 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl p-8 shadow-lg space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
          <ShieldIcon className="w-6 h-6 text-slate-100" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">404 — Endpoint Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested resource or decentralized path does not exist on this SentinelChain gateway.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all"
          >
            Return to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
