import { EncryptedPayload, StoredSealedAsset } from './types';

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

/**
 * Export CryptoKey to raw 256-bit hex string (64 characters)
 */
export async function exportKeyToRawHex(key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const raw = await subtle.exportKey('raw', key);
  return bufferToHex(raw);
}

/**
 * Import raw 256-bit hex string back into a valid AES-GCM CryptoKey
 */
export async function importKeyFromRawHex(hex: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const rawBytes = hexToBuffer(cleanHex);
  return await subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert an in-memory EncryptedPayload to a serializable StoredSealedAsset record
 */
export async function sealedAssetFromPayload(
  payload: EncryptedPayload,
  pinnedCid?: string
): Promise<StoredSealedAsset> {
  const keyHex = await exportKeyToRawHex(payload.cryptoKey);
  const rawCipher = payload.rawCiphertextHex || bufferToHex(payload.encryptedBuffer);
  const rawCiphertextHex = rawCipher.startsWith('0x') ? rawCipher : `0x${rawCipher}`;

  return {
    id: `sealed-${Date.now()}-${payload.sha256Hash.slice(2, 10)}`,
    fileName: payload.originalName,
    mimeType: payload.mimeType,
    sizeBytes: payload.sizeBytes,
    encryptedBytes: payload.encryptedBytes,
    sha256Hash: payload.sha256Hash,
    ciphertextHex: payload.ciphertextHex,
    rawCiphertextHex,
    ivHex: payload.ivHex,
    keyHex,
    pinnedCid: pinnedCid || undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Reconstruct an active EncryptedPayload from a stored StoredSealedAsset record
 */
export async function payloadFromSealedAsset(asset: StoredSealedAsset): Promise<EncryptedPayload> {
  const cryptoKey = await importKeyFromRawHex(asset.keyHex);
  const cleanIv = asset.ivHex.startsWith('0x') ? asset.ivHex.slice(2) : asset.ivHex;
  const iv = hexToBuffer(cleanIv);

  const cleanCipher = asset.rawCiphertextHex.startsWith('0x')
    ? asset.rawCiphertextHex.slice(2)
    : asset.rawCiphertextHex;
  const encryptedBytes = hexToBuffer(cleanCipher);
  const encryptedBuffer = encryptedBytes.buffer.slice(
    encryptedBytes.byteOffset,
    encryptedBytes.byteOffset + encryptedBytes.byteLength
  );

  return {
    ciphertextHex: asset.ciphertextHex,
    rawCiphertextHex: asset.rawCiphertextHex,
    ivHex: asset.ivHex,
    originalName: asset.fileName,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    encryptedBytes: asset.encryptedBytes,
    sha256Hash: asset.sha256Hash,
    latencyMs: 0,
    cryptoKey,
    iv,
    encryptedBuffer,
  };
}

/**
 * Universal matcher for CIPHERTEXT, IPFS Storage CID, or SHA-256 Checksum
 */
export function matchesSealedCredential(
  asset: {
    rawCiphertextHex?: string;
    ciphertextHex?: string;
    sha256Hash?: string;
    pinnedCid?: string;
  },
  input: string
): boolean {
  if (!input || typeof input !== 'string') return false;
  const rawInput = input.trim();
  if (rawInput.length < 5) return false;

  // Normalize: lowercased, stripped of trailing '...' or whitespace
  const clean = rawInput.toLowerCase().replace(/\.+$/, '').trim();
  const cleanNoHex = clean.startsWith('0x') ? clean.slice(2) : clean;

  // 1. Check IPFS Storage CID match
  if (asset.pinnedCid) {
    const cleanCid = asset.pinnedCid.toLowerCase().trim();
    if (clean === cleanCid || cleanCid.includes(clean) || clean.includes(cleanCid)) {
      return true;
    }
  }

  // 2. Check Ciphertext match (raw full hex or display prefix)
  const rawCipher = (asset.rawCiphertextHex || '').toLowerCase().trim();
  const rawCipherNoHex = rawCipher.startsWith('0x') ? rawCipher.slice(2) : rawCipher;

  const displayCipher = (asset.ciphertextHex || '').toLowerCase().replace(/\.+$/, '').trim();
  const displayCipherNoHex = displayCipher.startsWith('0x') ? displayCipher.slice(2) : displayCipher;

  if (
    (rawCipher && (rawCipher.includes(clean) || clean.includes(rawCipher))) ||
    (rawCipherNoHex && cleanNoHex.length >= 8 && (rawCipherNoHex.includes(cleanNoHex) || cleanNoHex.includes(rawCipherNoHex))) ||
    (displayCipher && (displayCipher.includes(clean) || clean.includes(displayCipher))) ||
    (displayCipherNoHex && cleanNoHex.length >= 8 && (displayCipherNoHex.includes(cleanNoHex) || cleanNoHex.includes(displayCipherNoHex)))
  ) {
    return true;
  }

  // 3. Check SHA-256 Checksum match
  if (asset.sha256Hash) {
    const cleanSha = asset.sha256Hash.toLowerCase().trim();
    const cleanShaNoHex = cleanSha.startsWith('0x') ? cleanSha.slice(2) : cleanSha;
    if (
      clean === cleanSha ||
      cleanNoHex === cleanShaNoHex ||
      (cleanNoHex.length >= 12 && cleanShaNoHex.includes(cleanNoHex))
    ) {
      return true;
    }
  }

  return false;
}

// Persistent Client Vault in LocalStorage
const VAULT_STORAGE_KEY = 'sentinel_sealed_vault';

export function listSealedAssetsFromVault(): StoredSealedAsset[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSealedAssetToVault(asset: StoredSealedAsset): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const list = listSealedAssetsFromVault();
    const cleanSha = asset.sha256Hash.toLowerCase();
    const cleanRaw = asset.rawCiphertextHex.toLowerCase();
    const filtered = list.filter(
      (a) =>
        a.sha256Hash.toLowerCase() !== cleanSha &&
        a.rawCiphertextHex.toLowerCase() !== cleanRaw
    );
    filtered.unshift(asset);
    const trimmed = filtered.slice(0, 30);
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save sealed asset to localStorage vault:', err);
  }
}

export function updateSealedAssetCidInVault(sha256Hash: string, cid: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const list = listSealedAssetsFromVault();
    const cleanSha = sha256Hash.toLowerCase();
    for (const item of list) {
      if (item.sha256Hash.toLowerCase() === cleanSha) {
        item.pinnedCid = cid;
      }
    }
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to update CID in vault:', err);
  }
}

export function getSealedAssetFromVault(query: string): StoredSealedAsset | null {
  const list = listSealedAssetsFromVault();
  for (const asset of list) {
    if (matchesSealedCredential(asset, query)) {
      return asset;
    }
  }
  return null;
}

/**
 * Directly decrypt a stored sealed asset envelope
 */
export async function decryptSealedAsset(asset: StoredSealedAsset): Promise<DecryptionVerification> {
  const payload = await payloadFromSealedAsset(asset);
  return await decryptPayload(
    payload.encryptedBuffer,
    payload.cryptoKey,
    payload.iv,
    asset.mimeType
  );
}
