import React, { useState } from 'react';
import { AuditRecord } from '@/lib/types';
import { SearchIcon, DownloadIcon, ExternalLinkIcon } from './Icons';

interface AuditLedgerTableProps {
  logs: AuditRecord[];
  isAuthenticated?: boolean;
}

export const AuditLedgerTable: React.FC<AuditLedgerTableProps> = ({ logs, isAuthenticated = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Clear search input when user logs out or disconnects
  React.useEffect(() => {
    if (!isAuthenticated) {
      setSearchTerm('');
      setRoleFilter('All');
    }
  }, [isAuthenticated]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.assetCid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actionType && log.actionType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.did && log.did.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'All' || log.role.toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  const exportCsv = () => {
    window.open('/api/audit?format=csv', '_blank');
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-4">
      {/* Table Header - Shopeers B2B Style */}
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
          {/* Search with inline icon */}
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search CID / Hash / DID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-200/90 rounded-xl bg-slate-50/70 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200/90 rounded-xl bg-slate-50/70 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Auditor">Auditor</option>
            <option value="User">User</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={exportCsv}
            className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadIcon className="w-3 h-3 text-slate-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <th className="pb-3 pr-4">Timestamp</th>
              <th className="pb-3 pr-4">Asset CID / NFT</th>
              <th className="pb-3 pr-4">Actor Wallet / DID</th>
              <th className="pb-3 pr-4">Role</th>
              <th className="pb-3 pr-4">Gas Used</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 text-right">PolygonScan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                  No matching access logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pr-4 text-slate-500 whitespace-nowrap tabular-nums">{log.timestamp}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-900 max-w-[200px] truncate" title={log.assetCid}>
                    <div className="flex items-center gap-1.5">
                      {log.tokenId && (
                        <span className="text-[10px] bg-slate-900 text-white font-sans px-1.5 py-0.2 rounded font-medium">
                          #{log.tokenId}
                        </span>
                      )}
                      <span className="truncate font-mono text-xs text-slate-700">{log.assetCid}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600" title={log.did || log.userAddress}>
                    {log.userAddress}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-sans text-[11px] font-medium border border-slate-200/50">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-600 whitespace-nowrap tabular-nums">{log.gasUsed}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                        log.status === 'Verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {log.actionType ? `${log.status}: ${log.actionType}` : log.status}
                    </span>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <a
                      href={log.explorerUrl || `https://amoy.polygonscan.com/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 hover:text-slate-600 underline text-[11px] font-sans font-medium inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
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
