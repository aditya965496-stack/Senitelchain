import React from 'react';
import { NodeItem } from '@/lib/types';

interface PipelineStepperProps {
  nodes: NodeItem[];
  activeNode: NodeItem;
  onSelectNode: (node: NodeItem) => void;
  isAuthenticated: boolean;
  isEncrypted: boolean;
  isPinned: boolean;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  nodes,
  activeNode,
  onSelectNode,
  isAuthenticated,
  isEncrypted,
  isPinned,
}) => {
  return (
    <div className="space-y-4">
      {/* 4 Pipeline Node Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nodes.map((node) => {
          const isSelected = activeNode.id === node.id;
          let statusBadge = node.status;
          let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';

          if (node.id === 'auth' && isAuthenticated) {
            statusBadge = 'Verified';
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          } else if (node.id === 'encryption' && isEncrypted) {
            statusBadge = 'Sealed';
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          } else if (node.id === 'storage' && isPinned) {
            statusBadge = 'Synced';
            badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
          } else if (node.id === 'contract') {
            statusBadge = 'Active';
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          }

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-slate-950 bg-white shadow-md ring-1 ring-slate-950'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {node.step}
                  </span>
                  <h3 className="font-semibold text-sm text-slate-900">{node.title}</h3>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
                  {statusBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-1">{node.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Active Step Specifications Drawer */}
      <div className="bg-slate-950 text-white p-4 rounded-2xl flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-mono bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg font-bold">
            Step {activeNode.step}
          </span>
          <div>
            <h4 className="font-semibold text-sm">{activeNode.title} Specifications</h4>
            <p className="text-slate-400 text-[11px] mt-0.5">{activeNode.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
