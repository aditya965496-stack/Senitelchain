export type UserRole =
  | 'Admin (Issuer)'
  | 'Officer (Requester)'
  | 'Auditor (Viewer - Read Only)';

export interface NodeItem {
  id: 'auth' | 'encryption' | 'storage' | 'contract';
  step: string;
  title: string;
  subtitle: string;
  status: 'Ready' | 'Active' | 'Verified' | 'Sealed' | 'Synced' | 'Error';
  description: string;
}

export interface EncryptedPayload {
  ciphertextHex: string;
  ivHex: string;
  saltHex?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  encryptedBytes: number;
  sha256Hash: string;
  latencyMs: number;
  cryptoKey: CryptoKey;
  iv: Uint8Array;
  encryptedBuffer: ArrayBuffer;
}

export interface IPFSResponse {
  cid: string;
  size: number;
  timestamp: string;
  gatewayUrl: string;
  isPinataPinned?: boolean;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  assetCid: string;
  userAddress: string;
  role: UserRole;
  txHash: string;
  gasUsed: string;
  blockNumber?: number;
  status: 'Verified' | 'Simulated' | 'Pending' | 'Reverted';
  explorerUrl?: string;
}

export interface TelemetryStats {
  encryptionLatencyMs: number | null;
  payloadFootprintBytes: number | null;
  gasUsed: string;
  cipherAlgorithm: string;
  integrityHash: string;
  activeNetwork: string;
}
