import type { UserRole } from './types';

/**
 * Enterprise Input Validation & Sanitization Engine
 * Protects against injection, malformed payloads, and invalid cryptographic primitives.
 */

// Valid user roles
export const VALID_ROLES: UserRole[] = [
  'Admin (Issuer)',
  'Manager (Asset Manager)',
  'Auditor (Viewer - Read Only)',
  'User (Asset Owner)',
  'Officer (Requester)',
];

/**
 * Validates standard Ethereum address format (42 characters, starting with 0x)
 */
export function isValidEthereumAddress(address: unknown): address is string {
  if (typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * Validates transaction hash format (66 characters, starting with 0x)
 */
export function isValidTxHash(hash: unknown): hash is string {
  if (typeof hash !== 'string') return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash.trim());
}

/**
 * Validates SHA-256 hex digest (with or without 0x prefix, 64 hex characters)
 */
export function isValidSha256(digest: unknown): digest is string {
  if (typeof digest !== 'string') return false;
  const clean = digest.startsWith('0x') ? digest.slice(2) : digest;
  return /^[a-fA-F0-9]{64}$/.test(clean.trim());
}

/**
 * Validates IPFS Content Identifier (CIDv0 or CIDv1 or Sentinel custom deterministic CID)
 */
export function isValidCID(cid: unknown): cid is string {
  if (typeof cid !== 'string') return false;
  const trimmed = cid.trim();
  // IPFS CIDv0: starts with Qm (46 chars base58)
  // IPFS CIDv1: starts with bafy... or bafk... (base32)
  // Sentinel custom multihash CID: QmSentinel... or bafybeih...
  return (
    trimmed.length >= 20 &&
    trimmed.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(trimmed)
  );
}

/**
 * Validates W3C Sentinel DID format (did:sentinel:<chainId>:<address>)
 */
export function isValidDID(did: unknown): did is string {
  if (typeof did !== 'string') return false;
  return /^did:sentinel:\d+:0x[a-fA-F0-9]{40}$/i.test(did.trim());
}

/**
 * Validates Role
 */
export function isValidRole(role: unknown): role is UserRole {
  if (typeof role !== 'string') return false;
  return VALID_ROLES.includes(role as UserRole);
}

/**
 * Formula Injection (CSV Injection) Sanitizer
 * When data is exported to CSV, cells starting with '=', '+', '-', '@', '\t', '\r'
 * can be interpreted as executable formulas by Excel/Google Sheets.
 * This prepends a single quote to neutralize formula execution.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  
  // Neutralize formula injection characters
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  
  // Escape double quotes for CSV format
  return str.replace(/"/g, '""');
}

/**
 * Maximum allowable payload size for IPFS pinning and encryption (50 MB)
 */
export const MAX_PAYLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
