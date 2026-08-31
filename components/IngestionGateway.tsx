import React from 'react';
import { EncryptedPayload, UserRole } from '@/lib/types';
import { DecryptionVerification } from '@/lib/crypto';

interface IngestionGatewayProps {
  userRole: UserRole;
  selectedFile: File | null;
  encryptedPayload: EncryptedPayload | null;
  simulatedCID: string;
  decryptedResult: DecryptionVerification | null;
  isProcessing: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEncrypt: () => void;
  onPinIPFS: () => void;
  onVerifyDecrypt: () => void;
}

export const IngestionGateway: React.FC<IngestionGatewayProps> = ({
  userRole,
  selectedFile,
  encryptedPayload,
  simulatedCID,
  decryptedResult,
  isProcessing,
  onFileChange,
  onEncrypt,
  onPinIPFS,
  onVerifyDecrypt,
}) => {
  const isAuditor = userRole.includes('Auditor');

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Asset Ingestion & Cryptographic Gateway
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hardware-accelerated AES-256-GCM zero-knowledge client sealing.
          </p>
        </div>
        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
          WebCrypto API
        </span>
      </div>

      {/* File Upload Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Source Document (PDF / Binary / SQL / Text)
        </label>
        <input
          type="file"
          disabled={isAuditor || isProcessing}
          onChange={onFileChange}
          className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-white hover:file:bg-slate-800 file:cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        />
        {selectedFile && (
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
            <span>Name: <strong>{selectedFile.name}</strong></span>
            <span>•</span>
            <span>Size: <strong>{(selectedFile.size / 1024).toFixed(2)} KB</strong></span>
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          onClick={onEncrypt}
          disabled={!selectedFile || isAuditor || isProcessing}
          className={`py-3 px-4 rounded-2xl text-xs font-semibold transition-all border shadow-sm flex items-center justify-center gap-2 ${
            encryptedPayload
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <span>🔒</span>
          <span>{encryptedPayload ? '✓ AES-256-GCM Encrypted' : 'Step 02: Encrypt Payload'}</span>
        </button>

        <button
          onClick={onPinIPFS}
          disabled={!encryptedPayload || isAuditor || isProcessing}
          className={`py-3 px-4 rounded-2xl text-xs font-semibold transition-all border shadow-sm flex items-center justify-center gap-2 ${
            simulatedCID
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <span>📦</span>
          <span>{simulatedCID ? '✓ IPFS Pin Complete' : 'Step 03: Pin to IPFS'}</span>
        </button>
      </div>

      {/* Encrypted Output Display */}
      {encryptedPayload && (
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Sealed Ciphertext Blob & Integrity Digest
            </span>
            <button
              onClick={onVerifyDecrypt}
              disabled={isProcessing}
              className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>🔓</span>
              <span>Verify Decrypt & Integrity</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 break-all leading-relaxed space-y-1.5">
            <div>
              <span className="text-slate-400">CIPHERTEXT: </span>
              {encryptedPayload.ciphertextHex}
            </div>
            <div className="text-[10px] text-slate-500">
              <span>SHA-256 CHECKSUM: </span>
              <strong>{encryptedPayload.sha256Hash}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Decrypted verification preview panel */}
      {decryptedResult && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-2.5 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>✅</span>
              <span>Hardware AES-256-GCM Verification Passed</span>
            </span>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-2 py-0.5 rounded-full font-bold">
              128-bit Auth Tag Valid
            </span>
          </div>

          <div className="text-[11px] font-mono text-emerald-950 bg-white/80 p-3 rounded-xl border border-emerald-200 break-all space-y-1">
            <div><strong>Status:</strong> Restored {(decryptedResult.verifiedBytes / 1024).toFixed(2)} KB without tampering</div>
            <div><strong>Verified SHA-256:</strong> {decryptedResult.sha256Hash}</div>
            {decryptedResult.isText && (
              <div className="pt-1.5 border-t border-emerald-100 text-slate-700">
                <span className="text-[10px] text-slate-400 block mb-0.5">TEXT PREVIEW:</span>
                {decryptedResult.textPreview}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <a
              href={decryptedResult.decryptedBlobUrl}
              download={selectedFile ? `decrypted_${selectedFile.name}` : 'decrypted_document'}
              className="text-xs font-semibold bg-emerald-900 hover:bg-emerald-950 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 inline-flex"
            >
              <span>💾</span>
              <span>Download Restored File</span>
            </a>
          </div>
        </div>
      )}

      {/* Storage CID Output */}
      {simulatedCID && (
        <div className="text-[11px] font-mono text-slate-800 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <span><strong>IPFS Storage CID:</strong> {simulatedCID}</span>
          <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold">
            IMMUTABLE
          </span>
        </div>
      )}
    </div>
  );
};
