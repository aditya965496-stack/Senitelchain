import { ethers } from 'ethers';
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
 * Create a cryptographic authentication challenge for wallet signing
 */
export function createAuthChallenge(
  address: string,
  did: string,
  role: UserRole,
  nonce: string = Math.random().toString(36).substring(2, 15)
): string {
  const timestamp = new Date().toISOString();
  return [
    '=== SentinelChain Zero-Trust Access Portal ===',
    'Self-Sovereign Identity Authentication Proof',
    '',
    `DID: ${did}`,
    `Subject: ${address}`,
    `Assigned Role: ${role}`,
    `Network: Polygon Amoy (Chain ID ${POLYGON_AMOY_CHAIN_ID})`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`,
    '',
    'I cryptographically authenticate my decentralized identity and declare zero-trust session establishment.',
  ].join('\n');
}

/**
 * Verify ECDSA cryptographic signature against the expected address and challenge
 */
export function verifyDIDSignature(
  challenge: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(challenge, signature);
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
  challenge: string,
  signature: string
): CryptographicProof {
  return {
    type: 'EcdsaSecp256k1RecoveryMethod2020',
    created: new Date().toISOString(),
    verificationMethod: `${did}#controller`,
    proofPurpose: 'authentication',
    challenge,
    jws: signature,
  };
}
