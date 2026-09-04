export type UserRole =
  | 'Admin (Issuer)'
  | 'Manager (Asset Manager)'
  | 'Auditor (Viewer - Read Only)'
  | 'User (Asset Owner)'
  | 'Officer (Requester)'; // Preserved for backward compatibility

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
  metadataUri?: string;
  nftMetadata?: NFTMetadata;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  properties: {
    assetCid: string;
    sha256Digest: string;
    ownerDid: string;
    ownerAddress: string;
    creatorAddress: string;
    cipherAlgorithm: string;
    fileSize: number;
    mimeType: string;
    timestamp: string;
    contractNetwork: string;
  };
}

export interface AssetNFT {
  tokenId: number;
  assetCid: string;
  sha256Digest: string;
  owner: string;
  ownerDid: string;
  creator: string;
  tokenUri: string;
  mintedAt: number;
  isAllocated: boolean;
}

export interface DIDVerificationMethod {
  id: string;
  type: string;
  controller: string;
  blockchainAccountId: string;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: DIDVerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  created: string;
  updated?: string;
  role: UserRole;
  status: 'Active' | 'Revoked' | 'Suspended';
}

export interface StoredIdentity {
  did: string;
  address: string;
  role: UserRole;
  didDocument: DIDDocument;
  registeredAt: string;
  isActive: boolean;
  isCryptographicallyVerified?: boolean;
}

export interface CryptographicProof {
  type: 'EcdsaSecp256k1RecoveryMethod2020' | 'Eip712Signature2021';
  created: string;
  verificationMethod: string;
  proofPurpose: 'authentication';
  challenge: string;
  jws: string;
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
  status: 'Verified' | 'Pending' | 'Reverted';
  explorerUrl?: string;
  actionType?: 'Identity Registered' | 'NFT Minted' | 'Asset Allocated' | 'Access Verified' | 'Role Updated';
  tokenId?: number;
  did?: string;
}

export interface TelemetryStats {
  encryptionLatencyMs: number | null;
  payloadFootprintBytes: number | null;
  gasUsed: string;
  cipherAlgorithm: string;
  integrityHash: string;
  activeNetwork: string;
}
