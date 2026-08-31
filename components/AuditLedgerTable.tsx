import React, { useState } from 'react';
import { AuditRecord } from '@/lib/types';

interface AuditLedgerTableProps {
  logs: AuditRecord[];
}

export const AuditLedgerTable: React.FC<AuditLedgerTableProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.assetCid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.txHash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === 'All' || log.role.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  const exportCsv = () => {
    window.open('/api/audit?format=csv', '_blank');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Immutable Access Control Audit Trail
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic ledger logs committed to Polygon Amoy EVM registry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search CID / Hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Officer">Officer</option>
            <option value="Auditor">Auditor</option>
          </select>

          <button
            onClick={exportCsv}
            className="text-xs font-medium bg-slate-950 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-sm transition-all"
          >
            Export CSV 📥
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase">
              <th className="pb-3 pr-4">Timestamp</th>
              <th className="pb-3 pr-4">Asset CID</th>
              <th className="pb-3 pr-4">Actor Wallet</th>
              <th className="pb-3 pr-4">Role</th>
              <th className="pb-3 pr-4">Gas Used</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 text-right">PolygonScan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400 font-sans">
                  No matching access logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-4 text-slate-500">{log.timestamp}</td>
                  <td className="py-3 pr-4 font-bold text-slate-900">{log.assetCid}</td>
                  <td className="py-3 pr-4">{log.userAddress}</td>
                  <td className="py-3 pr-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-sans text-[11px] font-medium">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{log.gasUsed}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                        log.status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <a
                      href={log.explorerUrl || `https://amoy.polygonscan.com/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-950 hover:text-slate-600 underline text-[11px] font-sans font-medium"
                    >
                      View ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
