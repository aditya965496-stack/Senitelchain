import React from 'react';
import { NodeItem } from '@/lib/types';
import { CheckCircleIcon, CpuChipIcon } from './Icons';

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
    <div className="space-y-3.5">
      {/* 4 Pipeline Node Cards - Shopeers B2B Analytics Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {nodes.map((node) => {
          const isSelected = activeNode.id === node.id;
          let statusBadge = node.status;
          let badgeColor = 'bg-slate-50 text-slate-600 border-slate-200';
          let isComplete = false;

          if (node.id === 'auth' && isAuthenticated) {
            statusBadge = 'Verified';
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            isComplete = true;
          } else if (node.id === 'encryption' && isEncrypted) {
            statusBadge = 'Sealed';
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            isComplete = true;
          } else if (node.id === 'storage' && isPinned) {
            statusBadge = 'Synced';
            badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
            isComplete = true;
          } else if (node.id === 'contract') {
            statusBadge = 'Active';
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          }

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white ${
                isSelected
                  ? 'border-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)] ring-1 ring-slate-900'
                  : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {node.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 leading-none">
                      {node.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {node.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${badgeColor}`}
                >
                  {isComplete && <CheckCircleIcon className="w-3 h-3 text-emerald-600" />}
                  <span>{statusBadge}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Step Specifications Drawer - Clean Shopeers Light Palette (No duplicate step number) */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex items-center justify-between text-xs shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
            <CpuChipIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">{activeNode.title} Specifications</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">{activeNode.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
