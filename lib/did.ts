import { ethers, TypedDataField } from 'ethers';
import { DIDDocument, CryptographicProof, UserRole } from './types';

export const SENTINEL_DID_METHOD = 'sentinel';
export const POLYGON_AMOY_CHAIN_ID = 80002;

/**
 * Generate W3C-compliant Decentralized Identifier (DID)
 * Format: did:sentinel:80002:<checksum_address>
 */
export function generateDID(address: string, chainId: number = POLYGON_AMOY_CHAIN_ID): string {
  if (!address || !address.startsWith('0x')) {
    throw new Error('Invalid address for DID generation');
  }
  const cleanAddr = address.toLowerCase();
  return `did:${SENTINEL_DID_METHOD}:${chainId}:${cleanAddr}`;
}

/**
 * Format DID for compact display in UI/telemetry
 */
export function formatDID(did: string): string {
  if (!did) return '';
  const parts = did.split(':');
  if (parts.length < 4) return did;
  const address = parts[3];
  return `did:sentinel:${parts[2]}:${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Extract Ethereum address from a Sentinel DID
 */
export function didToAddress(did: string): string {
  const parts = did.split(':');
  if (parts.length >= 4 && parts[3].startsWith('0x')) {
    return parts[3];
  }
  throw new Error(`Invalid Sentinel DID format: ${did}`);
}

/**
 * Create a W3C-compliant DID Document
 */
export function createDIDDocument(
  address: string,
  role: UserRole,
  chainId: number = POLYGON_AMOY_CHAIN_ID
): DIDDocument {
  const did = generateDID(address, chainId);
  const now = new Date().toISOString();

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
    ],
    id: did,
    controller: did,
    verificationMethod: [
      {
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `eip155:${chainId}:${address}`,
      },
    ],
    authentication: [`${did}#controller`],
    assertionMethod: [`${did}#controller`],
    created: now,
    role,
    status: 'Active',
  };
}

/**
 * Generate cryptographically secure nonce for authentication challenges
 */
export function generateSecureNonce(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * EIP-712 Typed Data Domain & Schema Definitions
 * Eliminates MetaMask, Rabby, and Trust Wallet 'Deceptive Request / Dangerous Message' heuristics
 * by presenting a mathematically verified structured domain card.
 */
export const EIP712_AUTH_DOMAIN = {
  name: 'SentinelChain Enterprise',
  version: '1',
  chainId: POLYGON_AMOY_CHAIN_ID,
} as const;

export const EIP712_AUTH_TYPES: Record<string, TypedDataField[]> = {
  SentinelAuthProof: [
    { name: 'did', type: 'string' },
    { name: 'subject', type: 'address' },
    { name: 'role', type: 'string' },
    { name: 'statement', type: 'string' },
    { name: 'nonce', type: 'string' },
    { name: 'timestamp', type: 'string' },
  ],
};

export interface EIP712AuthMessage {
  did: string;
  subject: string;
  role: string;
  statement: string;
  nonce: string;
  timestamp: string;
}

export interface EIP712AuthPayload {
  domain: typeof EIP712_AUTH_DOMAIN;
  types: typeof EIP712_AUTH_TYPES;
  message: EIP712AuthMessage;
}

/**
 * Construct EIP-712 authentication payload for zero-warning wallet signing
 */
export function createEIP712AuthData(
  address: string,
  did: string,
  role: UserRole,
  nonce: string = generateSecureNonce()
): EIP712AuthPayload {
  return {
    domain: EIP712_AUTH_DOMAIN,
    types: EIP712_AUTH_TYPES,
    message: {
      did,
      subject: address,
      role,
      statement: 'Authenticate decentralized identity for Zero-Trust session establishment on Polygon Amoy.',
      nonce,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Verify EIP-712 Typed Data signature
 */
export function verifyEIP712Signature(
  payload: EIP712AuthPayload,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyTypedData(
      payload.domain,
      payload.types,
      payload.message,
      signature
    );
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (err) {
    console.error('EIP-712 signature verification failed:', err);
    return false;
  }
}

/**
 * Create EIP-4361 (Sign-In with Ethereum - SIWE) compliant authentication challenge.
 * MetaMask, Rabby, and Trust Wallet natively recognize this official standard,
 * presenting a verified "Sign-in Request" dialog and eliminating all "Deceptive Request / Dangerous Message" warnings.
 */
export function createEIP4361Challenge(
  address: string,
  did: string,
  role: UserRole,
  nonce: string = generateSecureNonce(),
  options?: { domain?: string; uri?: string }
): string {
  const domain = options?.domain || (typeof window !== 'undefined' && window.location?.host ? window.location.host : 'localhost:3000');
  const uri = options?.uri || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000');
  const issuedAt = new Date().toISOString();

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    `Sign in to SentinelChain Enterprise Zero-Trust Portal under ${role} role.`,
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${POLYGON_AMOY_CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    'Resources:',
    `- ${did}`,
    `- urn:sentinel:role:${role.replace(/\s+/g, '_')}`,
  ].join('\n');
}

/**
 * Backward-compatible authentication challenge generator (EIP-4361 compliant)
 */
export function createAuthChallenge(
  address: string,
  did: string,
  role: UserRole,
  nonce: string = generateSecureNonce(),
  options?: { domain?: string; uri?: string }
): string {
  return createEIP4361Challenge(address, did, role, nonce, options);
}

/**
 * Universal signature verifier: Automatically handles both EIP-712 typed data payloads
 * and legacy personal_sign challenges.
 */
export function verifyDIDSignature(
  challengeOrPayload: string | EIP712AuthPayload,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    // 1. Check if challenge is an EIP-712 payload object
    if (typeof challengeOrPayload === 'object' && challengeOrPayload?.domain && challengeOrPayload?.message) {
      return verifyEIP712Signature(challengeOrPayload as EIP712AuthPayload, signature, expectedAddress);
    }

    // 2. Check if challenge is a JSON-encoded EIP-712 payload string
    if (typeof challengeOrPayload === 'string' && challengeOrPayload.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(challengeOrPayload);
        if (parsed.domain && parsed.message) {
          return verifyEIP712Signature(parsed as EIP712AuthPayload, signature, expectedAddress);
        }
      } catch {
        // Fall back to message verification
      }
    }

    // 3. Fallback to standard personal_sign verifyMessage
    const recoveredAddress = ethers.verifyMessage(challengeOrPayload as string, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (err) {
    console.error('Cryptographic signature verification failed:', err);
    return false;
  }
}

/**
 * Build cryptographic proof bundle
 */
export function createCryptographicProof(
  did: string,
  challenge: string | EIP712AuthPayload,
  signature: string
): CryptographicProof {
  return {
    type: typeof challenge === 'object' ? 'Eip712Signature2021' : 'EcdsaSecp256k1RecoveryMethod2020',
    created: new Date().toISOString(),
    verificationMethod: `${did}#controller`,
    proofPurpose: 'authentication',
    challenge: typeof challenge === 'object' ? JSON.stringify(challenge) : challenge,
    jws: signature,
  };
}
