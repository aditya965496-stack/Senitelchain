import React, { useState } from 'react';
import { DIDDocument } from '@/lib/types';
import { CopyIcon, CheckIcon, DownloadIcon, ShieldIcon } from './Icons';

interface DIDDocumentModalProps {
  isOpen: boolean;
  didDocument: DIDDocument | null;
  onClose: () => void;
}

export const DIDDocumentModal: React.FC<DIDDocumentModalProps> = ({
  isOpen,
  didDocument,
  onClose,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !didDocument) return null;

  const didJson = JSON.stringify(didDocument, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(didJson);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([didJson], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `did-document-${didDocument.id.replace(/:/g, '_')}.jsonld`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldIcon className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                W3C Decentralized Identifier (DID) Document
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {didDocument.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - JSON-LD Viewer */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Metadata Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border border-slate-200">
              Standard: W3C DID Core 1.0
            </span>
            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border border-emerald-200">
              Status: {didDocument.status}
            </span>
            <span className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border border-blue-200">
              Role: {didDocument.role}
            </span>
          </div>

          {/* JSON Syntax Box */}
          <div className="relative bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
            <pre className="text-[11px] leading-relaxed">
              <code>{didJson}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleDownload}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Download JSON-LD</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Document</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
