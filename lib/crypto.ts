import { EncryptedPayload } from './types';

/**
 * Buffer to Hex string converter
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hex string to Uint8Array converter
 */
export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (SubtleCrypto) is not available in this environment.');
}

export function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('Web Crypto API (getRandomValues) is not available in this environment.');
}

/**
 * Calculate cryptographic SHA-256 digest of an ArrayBuffer
 */
export async function calculateSha256(data: ArrayBuffer): Promise<string> {
  const subtle = getSubtleCrypto();
  const digest = await subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

/**
 * Hardware AES-256-GCM symmetric encryption using Web Crypto API
 */
export async function encryptFilePayload(file: File): Promise<EncryptedPayload> {
  const startTime = performance.now();
  const fileBuffer = await file.arrayBuffer();

  // 1. Calculate source document integrity hash
  const sha256Hash = await calculateSha256(fileBuffer);

  // 2. Generate 256-bit AES-GCM Key
  const subtle = getSubtleCrypto();
  const cryptoKey = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 3. Generate 96-bit random IV (NIST recommendation for GCM)
  const iv = getRandomValues(new Uint8Array(12));

  // 4. Execute authenticated client-side encryption
  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    fileBuffer
  );

  const endTime = performance.now();
  const latencyMs = Number((endTime - startTime).toFixed(2));

  const ciphertextHex = bufferToHex(encryptedBuffer);
  const ivHex = bufferToHex(iv);

  return {
    ciphertextHex: `0x${ciphertextHex.slice(0, 64)}...`,
    rawCiphertextHex: `0x${ciphertextHex}`,
    ivHex: `0x${ivHex}`,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    encryptedBytes: encryptedBuffer.byteLength,
    sha256Hash: `0x${sha256Hash}`,
    latencyMs,
    cryptoKey,
    iv,
    encryptedBuffer,
  };
}

export interface DecryptionVerification {
  textPreview: string;
  integrityValid: boolean;
  verifiedBytes: number;
  decryptedBlobUrl: string;
  sha256Hash: string;
  isText: boolean;
}

/**
 * Client-side Decryption & Zero-Knowledge Tag Verification
 */
export async function decryptPayload(
  encryptedBuffer: ArrayBuffer,
  cryptoKey: CryptoKey,
  iv: Uint8Array,
  mimeType: string = 'application/octet-stream'
): Promise<DecryptionVerification> {
  try {
    const subtle = getSubtleCrypto();
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedBuffer
    );

    const sha256Hash = await calculateSha256(decryptedBuffer);

    // Create a downloadable Blob URL if in browser environment
    let decryptedBlobUrl = '';
    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([decryptedBuffer], { type: mimeType });
      decryptedBlobUrl = URL.createObjectURL(blob);
    }

    let textPreview = '';
    let isText = false;
    if (
      mimeType.startsWith('text/') ||
      mimeType.includes('json') ||
      mimeType.includes('javascript') ||
      mimeType.includes('sql')
    ) {
      const decoder = new TextDecoder('utf-8');
      textPreview = decoder.decode(decryptedBuffer.slice(0, 500));
      isText = true;
    } else {
      textPreview = `Binary File (${mimeType || 'Document'}) — ${decryptedBuffer.byteLength.toLocaleString()} bytes restored`;
      isText = false;
    }

    return {
      textPreview,
      integrityValid: true,
      verifiedBytes: decryptedBuffer.byteLength,
      decryptedBlobUrl,
      sha256Hash: `0x${sha256Hash}`,
      isText,
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Integrity verification failed. Ciphertext has been tampered with or key is invalid.');
  }
}

/**
 * Export CryptoKey to JSON Web Key (JWK) for secure envelope transfer
 */
export async function exportKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  const subtle = getSubtleCrypto();
  return await subtle.exportKey('jwk', key);
}
