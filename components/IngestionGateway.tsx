import React, { useState, useMemo } from 'react';
import { EncryptedPayload, UserRole, StoredSealedAsset } from '@/lib/types';
import {
  DecryptionVerification,
  matchesSealedCredential,
  getSealedAssetFromVault,
  saveSealedAssetToVault,
  payloadFromSealedAsset,
  decryptPayload,
} from '@/lib/crypto';
import {
  LockIcon,
  UnlockIcon,
  CloudPinIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileTextIcon,
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
} from './Icons';

interface IngestionGatewayProps {
  userRole: UserRole;
  selectedFile: File | null;
  encryptedPayload: EncryptedPayload | null;
  pinnedCID: string;
  decryptedResult: DecryptionVerification | null;
  isProcessing: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEncrypt: () => void;
  onPinIPFS: () => void;
  onVerifyDecrypt: () => void;
  onLockFile?: () => void;
  onRestoreSealedPayload?: (payload: EncryptedPayload, cid?: string, result?: DecryptionVerification) => void;
}

export const IngestionGateway: React.FC<IngestionGatewayProps> = ({
  userRole,
  selectedFile,
  encryptedPayload,
  pinnedCID,
  decryptedResult,
  isProcessing,
  onFileChange,
  onEncrypt,
  onPinIPFS,
  onVerifyDecrypt,
  onLockFile,
  onRestoreSealedPayload,
}) => {
  const isAuditor = userRole.includes('Auditor');
  const [unlockKey, setUnlockKey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const lockedBlobUrl = useMemo(() => {
    if (!encryptedPayload) return '';
    try {
      const blob = new Blob([encryptedPayload.encryptedBuffer], { type: 'application/octet-stream' });
      return URL.createObjectURL(blob);
    } catch {
      return '';
    }
  }, [encryptedPayload]);

  const handleUnlockAndDecrypt = async () => {
    const input = unlockKey.trim();
    if (!input) {
      setUnlockError('Please enter the CIPHERTEXT or IPFS Storage CID to unlock this file.');
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');

    try {
      // 1. If encryptedPayload is currently in memory, check if credential matches
      if (encryptedPayload) {
        const matchesCurrent = matchesSealedCredential(
          {
            rawCiphertextHex: encryptedPayload.rawCiphertextHex,
            ciphertextHex: encryptedPayload.ciphertextHex,
            sha256Hash: encryptedPayload.sha256Hash,
            pinnedCid: pinnedCID,
          },
          input
        );

        if (matchesCurrent) {
          setUnlockError('');
          await onVerifyDecrypt();
          setIsUnlocking(false);
          return;
        }
      }

      // 2. Lookup in client-side persistent vault (localStorage)
      let matchedAsset: StoredSealedAsset | null = getSealedAssetFromVault(input);

      // 3. Fallback: Lookup in backend persistent database (/api/sealed-assets)
      if (!matchedAsset) {
        try {
          const res = await fetch(`/api/sealed-assets?q=${encodeURIComponent(input)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.asset) {
              const fetchedAsset: StoredSealedAsset = data.asset;
              matchedAsset = fetchedAsset;
              saveSealedAssetToVault(fetchedAsset);
            }
          }
        } catch (apiErr) {
          console.warn('Could not query backend sealed assets:', apiErr);
        }
      }

      if (matchedAsset) {
        const restoredPayload = await payloadFromSealedAsset(matchedAsset);
        const verification = await decryptPayload(
          restoredPayload.encryptedBuffer,
          restoredPayload.cryptoKey,
          restoredPayload.iv,
          matchedAsset.mimeType || 'application/octet-stream'
        );

        if (onRestoreSealedPayload) {
          onRestoreSealedPayload(restoredPayload, matchedAsset.pinnedCid, verification);
        }
        setUnlockError('');
        setIsUnlocking(false);
        return;
      }

      // If no matching asset could be found
      setUnlockError(
        "Access Denied: The entered credential does not match the file's CIPHERTEXT or IPFS Storage CID. File remains locked."
      );
    } catch (err: any) {
      console.error('Unlock error:', err);
      setUnlockError(`Verification failed: ${err.message || 'Decryption error'}`);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-5">
      {/* Card Header - Shopeers B2B Style */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Asset Ingestion & Cryptographic Gateway
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hardware-accelerated AES-256-GCM zero-knowledge client sealing.
          </p>
        </div>
      </div>

      {/* File Upload Selector */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Source Document (PDF / Binary / SQL / Text)
        </label>
        <div className="relative">
          <input
            type="file"
            disabled={isAuditor || isProcessing}
            onChange={onFileChange}
            className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 file:cursor-pointer border border-slate-200 rounded-xl bg-slate-50/70 p-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          />
        </div>
        {selectedFile && (
          <div className="flex items-center gap-2.5 text-[11px] text-slate-600 mt-2 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <FileTextIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Name: <strong className="text-slate-900">{selectedFile.name}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Size: <strong className="text-slate-900">{(selectedFile.size / 1024).toFixed(2)} KB</strong></span>
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          onClick={onEncrypt}
          disabled={!selectedFile || isAuditor || isProcessing}
          className={`py-3 px-4 rounded-xl text-xs font-semibold transition-all border shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            encryptedPayload
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200/90 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <LockIcon className={`w-3.5 h-3.5 ${encryptedPayload ? 'text-emerald-700' : 'text-slate-500'}`} />
          <span>{encryptedPayload ? 'AES-256-GCM Encrypted' : 'Step 02: Encrypt Payload'}</span>
        </button>

        <button
          onClick={onPinIPFS}
          disabled={!encryptedPayload || isAuditor || isProcessing}
          className={`py-3 px-4 rounded-xl text-xs font-semibold transition-all border shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            pinnedCID
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200/90 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <CloudPinIcon className={`w-3.5 h-3.5 ${pinnedCID ? 'text-blue-700' : 'text-slate-500'}`} />
          <span>{pinnedCID ? 'IPFS Pin Complete' : 'Step 03: Pin to IPFS'}</span>
        </button>
      </div>

      {/* Encrypted Output Display */}
      {encryptedPayload && (
        <div className="space-y-3 pt-1">
          {/* Card Header & Locked Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Sealed Ciphertext Blob & Integrity Digest
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                  decryptedResult
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {decryptedResult ? (
                  <>
                    <UnlockIcon className="w-3 h-3 text-emerald-700" />
                    <span>UNLOCKED</span>
                  </>
                ) : (
                  <>
                    <LockIcon className="w-3 h-3 text-amber-700" />
                    <span>LOCKED</span>
                  </>
                )}
              </span>
            </div>

            {/* Download Locked File (.enc) */}
            {lockedBlobUrl && (
              <a
                href={lockedBlobUrl}
                download={`locked_${selectedFile?.name || 'payload'}.enc`}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/90 px-3 py-1 rounded-xl border border-slate-200/90 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                title="Download raw locked encrypted ciphertext blob (.enc)"
              >
                <DownloadIcon className="w-3 h-3 text-slate-600" />
                <span>Download Locked File (.enc)</span>
              </a>
            )}
          </div>

          {/* Ciphertext & Digest Credentials Box */}
          <div className="text-[11px] font-mono text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 break-all leading-relaxed space-y-2">
            {/* CIPHERTEXT with Copy */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-slate-400 font-bold">CIPHERTEXT: </span>
                <span className="text-slate-800">{encryptedPayload.ciphertextHex}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    encryptedPayload.rawCiphertextHex || encryptedPayload.ciphertextHex,
                    'ciphertext'
                  )
                }
                className="text-slate-400 hover:text-slate-700 shrink-0 p-1 rounded hover:bg-slate-200/60 transition-all cursor-pointer"
                title="Copy Ciphertext"
              >
                {copiedField === 'ciphertext' ? (
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* SHA-256 CHECKSUM with Copy */}
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60">
              <div className="truncate">
                <span>SHA-256 CHECKSUM: </span>
                <strong className="text-slate-700">{encryptedPayload.sha256Hash}</strong>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(encryptedPayload.sha256Hash, 'sha256')}
                className="text-slate-400 hover:text-slate-700 shrink-0 p-1 rounded hover:bg-slate-200/60 transition-all cursor-pointer"
                title="Copy SHA-256 Checksum"
              >
                {copiedField === 'sha256' ? (
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* IPFS STORAGE CID with Copy (if pinned) */}
            {pinnedCID && (
              <div className="flex items-center justify-between gap-2 text-[10px] text-blue-900 bg-blue-50/80 p-2 rounded-lg border border-blue-200/70 pt-1.5">
                <div className="truncate">
                  <span className="font-semibold text-blue-800">IPFS Storage CID: </span>
                  <strong className="text-blue-950 font-mono">{pinnedCID}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pinnedCID, 'cid')}
                  className="text-blue-600 hover:text-blue-900 shrink-0 p-1 rounded hover:bg-blue-100 transition-all cursor-pointer"
                  title="Copy IPFS Storage CID"
                >
                  {copiedField === 'cid' ? (
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Access Control: Unlock by Ciphertext or IPFS Storage CID */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <LockIcon className="w-3.5 h-3.5 text-slate-700" />
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Access Control — Locked File Authorization
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Locked by Ciphertext / IPFS
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              This file is locked by the sealed ciphertext and IPFS storage. To access and decrypt the locked file, provide the matching <strong className="text-slate-800">CIPHERTEXT</strong> or <strong className="text-slate-800">IPFS Storage CID</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={unlockKey}
                onChange={(e) => {
                  setUnlockKey(e.target.value);
                  if (unlockError) setUnlockError('');
                }}
                placeholder="Enter CIPHERTEXT (0x...) or IPFS Storage CID (bafy...)..."
                className="flex-1 px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleUnlockAndDecrypt}
                disabled={isProcessing || isUnlocking}
                className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40 shrink-0"
              >
                <UnlockIcon className="w-3.5 h-3.5 text-white" />
                <span>{isUnlocking ? 'Verifying...' : 'Verify Decrypt & Integrity'}</span>
              </button>
            </div>

            {/* Unlock Error Feedback */}
            {unlockError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Access Control when no active in-memory payload is loaded (e.g. post-logout or page reload) */}
      {!encryptedPayload && !decryptedResult && (
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LockIcon className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Access Control — Locked File Authorization
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Locked by Ciphertext / IPFS
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            This file is locked by the sealed ciphertext and IPFS storage. To access and decrypt the locked file, provide the matching <strong className="text-slate-800">CIPHERTEXT</strong> or <strong className="text-slate-800">IPFS Storage CID</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={unlockKey}
              onChange={(e) => {
                setUnlockKey(e.target.value);
                if (unlockError) setUnlockError('');
              }}
              placeholder="Enter CIPHERTEXT (0x...) or IPFS Storage CID (bafy...)..."
              className="flex-1 px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleUnlockAndDecrypt}
              disabled={isProcessing || isUnlocking}
              className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40 shrink-0"
            >
              <UnlockIcon className="w-3.5 h-3.5 text-white" />
              <span>{isUnlocking ? 'Verifying...' : 'Verify Decrypt & Integrity'}</span>
            </button>
          </div>

          {/* Unlock Error Feedback */}
          {unlockError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}
        </div>
      )}

      {/* Decrypted verification preview panel */}
      {decryptedResult && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-300/80 rounded-2xl space-y-2.5 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>Hardware AES-256-GCM Verification Passed</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-mono px-2 py-0.5 rounded-full font-bold">
                128-bit Auth Tag Valid
              </span>
              {onLockFile && (
                <button
                  type="button"
                  onClick={() => {
                    setUnlockKey('');
                    onLockFile();
                  }}
                  className="text-[10px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-full transition-all cursor-pointer inline-flex items-center gap-1"
                  title="Lock the file again"
                >
                  <LockIcon className="w-2.5 h-2.5 text-slate-500" />
                  <span>Relock File</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-emerald-950 bg-white/90 p-3 rounded-xl border border-emerald-200/70 break-all space-y-1">
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
              className="text-xs font-semibold bg-emerald-900 hover:bg-emerald-950 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 inline-flex cursor-pointer"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              <span>Download Restored File</span>
            </a>
          </div>
        </div>
      )}

      {/* Storage CID Output */}
      {pinnedCID && !encryptedPayload && (
        <div className="text-[11px] font-mono text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <span><strong>IPFS Storage CID:</strong> {pinnedCID}</span>
          <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold">
            IMMUTABLE
          </span>
        </div>
      )}
    </div>
  );
};
