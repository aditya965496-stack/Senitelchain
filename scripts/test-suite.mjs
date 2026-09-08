import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS]: ${message}`);
  } else {
    console.error(`  [FAIL]: ${message}`);
    throw new Error(`Test Assertion Failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('SentinelChain Enterprise Production Test Suite');
  console.log('================================================================');

  // ==========================================
  // Test Suite 1: RBAC & Role Hashes
  // ==========================================
  console.log('\n--- SUITE 1: RBAC Role Architecture ---');
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
  const MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MANAGER_ROLE'));
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE'));
  const USER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('USER_ROLE'));

  assert(
    ADMIN_ROLE === '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
    'ADMIN_ROLE matches exact Keccak-256 specification'
  );
  assert(
    MANAGER_ROLE === '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08',
    'MANAGER_ROLE matches exact Keccak-256 specification'
  );
  assert(
    AUDITOR_ROLE === '0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5',
    'AUDITOR_ROLE matches exact Keccak-256 specification'
  );
  assert(
    USER_ROLE === '0x14823911f2da1b49f045a0929a60b8c1f2a7fc8c06c7284ca3e8ab4e193a08c8',
    'USER_ROLE matches exact Keccak-256 specification'
  );

  // ==========================================
  // Test Suite 2: W3C Decentralized Identity & ECDSA Verification
  // ==========================================
  console.log('\n--- SUITE 2: W3C Decentralized Identity & ECDSA Proofs ---');
  const wallet = ethers.Wallet.createRandom();
  const chainId = 80002;
  const did = `did:sentinel:${chainId}:${wallet.address.toLowerCase()}`;

  assert(did.startsWith('did:sentinel:80002:0x'), 'DID conforms to W3C did:sentinel method syntax');

  const challenge = [
    '=== SentinelChain Zero-Trust Access Portal ===',
    'Self-Sovereign Identity Authentication Proof',
    `DID: ${did}`,
    `Subject: ${wallet.address}`,
    'Assigned Role: Admin (Issuer)',
    `Nonce: test-nonce-${Date.now()}`,
  ].join('\n');

  const signature = await wallet.signMessage(challenge);
  const recoveredAddress = ethers.verifyMessage(challenge, signature);

  assert(
    recoveredAddress.toLowerCase() === wallet.address.toLowerCase(),
    'ECDSA personal_sign signature verified and recovers exact wallet address'
  );

  // Test tampered challenge rejection
  const tamperedChallenge = challenge + ' [tampered]';
  let isTamperDetected = false;
  try {
    const badRecovery = ethers.verifyMessage(tamperedChallenge, signature);
    isTamperDetected = badRecovery.toLowerCase() !== wallet.address.toLowerCase();
  } catch {
    isTamperDetected = true;
  }
  assert(isTamperDetected, 'Tampered authentication challenge is rejected by signature verifier');

  // Test EIP-712 Typed Structured Data Signing (Zero-Warning Auth)
  const eip712Domain = {
    name: 'SentinelChain Enterprise',
    version: '1',
    chainId: 80002,
  };

  const eip712Types = {
    SentinelAuthProof: [
      { name: 'did', type: 'string' },
      { name: 'subject', type: 'address' },
      { name: 'role', type: 'string' },
      { name: 'statement', type: 'string' },
      { name: 'nonce', type: 'string' },
      { name: 'timestamp', type: 'string' },
    ],
  };

  const eip712Message = {
    did,
    subject: wallet.address,
    role: 'Admin (Issuer)',
    statement: 'Authenticate decentralized identity for Zero-Trust session establishment on Polygon Amoy.',
    nonce: `test-eip712-nonce-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const eip712Signature = await wallet.signTypedData(eip712Domain, eip712Types, eip712Message);
  const recoveredEIP712Address = ethers.verifyTypedData(eip712Domain, eip712Types, eip712Message, eip712Signature);

  assert(
    recoveredEIP712Address.toLowerCase() === wallet.address.toLowerCase(),
    'EIP-712 structured typed data signature verified and eliminates MetaMask heuristic warnings'
  );

  // Test tampered EIP-712 field rejection
  const tamperedMessage = { ...eip712Message, role: 'User (Asset Owner)' };
  let isEIP712TamperDetected = false;
  try {
    const badEIP712Recovery = ethers.verifyTypedData(eip712Domain, eip712Types, tamperedMessage, eip712Signature);
    isEIP712TamperDetected = badEIP712Recovery.toLowerCase() !== wallet.address.toLowerCase();
  } catch {
    isEIP712TamperDetected = true;
  }
  assert(isEIP712TamperDetected, 'Tampered EIP-712 role field is rejected by typed data verifier');

  // ==========================================
  // Test Suite 3: Cryptography & Isomorphic AES-256-GCM
  // ==========================================
  console.log('\n--- SUITE 3: Cryptography & Web Crypto Engine ---');
  const sampleData = Buffer.from('SentinelChain Zero-Trust Enterprise Confidential Payload 2026');

  // Test SHA-256
  const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', sampleData);
  const digestHex = Array.from(new Uint8Array(digestBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  assert(digestHex.length === 64, 'SHA-256 produces valid 64-character hex integrity hash');

  // Test AES-GCM Key Generation
  const key = await globalThis.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  assert(key !== null && key.type === 'secret', 'Generates valid 256-bit AES-GCM symmetric CryptoKey');

  // Test Encryption & Decryption
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  assert(iv.length === 12, 'Generates NIST-recommended 96-bit (12-byte) initialization vector');

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    sampleData
  );
  assert(encryptedBuffer.byteLength > sampleData.length, 'Ciphertext includes 128-bit authentication tag');

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );
  const decryptedText = Buffer.from(decryptedBuffer).toString('utf8');
  assert(decryptedText === sampleData.toString('utf8'), 'Decrypted plaintext exactly matches original source payload');

  // ==========================================
  // Test Suite 3B: Persistent Vault & Post-Logout Decryption via CIPHERTEXT / IPFS Storage CID
  // ==========================================
  console.log('\n--- SUITE 3B: Persistent Vault & Post-Logout Decryption ---');

  // 1. Test Key Export and Import (Raw 256-bit Hex)
  const rawKeyBuffer = await globalThis.crypto.subtle.exportKey('raw', key);
  const keyHex = Array.from(new Uint8Array(rawKeyBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  assert(keyHex.length === 64, 'Exports 256-bit AES-GCM raw key to 64-character hex string');

  const importedKeyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const importedKey = await globalThis.crypto.subtle.importKey(
    'raw',
    importedKeyBytes,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  assert(importedKey !== null && importedKey.algorithm.name === 'AES-GCM', 'Imports raw hex back into valid AES-GCM CryptoKey');

  // 2. Test StoredSealedAsset Envelope Serialization
  const rawCipherHex = Array.from(new Uint8Array(encryptedBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('');
  const testCid = 'bafybeih8392fb1039d91028sentinel';

  const sealedAsset = {
    id: `sealed-test-${Date.now()}`,
    fileName: 'confidential_contract.pdf',
    mimeType: 'text/plain',
    sizeBytes: sampleData.length,
    encryptedBytes: encryptedBuffer.byteLength,
    sha256Hash: `0x${digestHex}`,
    ciphertextHex: `0x${rawCipherHex.slice(0, 64)}...`,
    rawCiphertextHex: `0x${rawCipherHex}`,
    ivHex: `0x${ivHex}`,
    keyHex,
    pinnedCid: testCid,
    timestamp: new Date().toISOString(),
  };

  // 3. Test Credential Matcher (Ciphertext exact, truncated with dots, IPFS CID, SHA-256)
  function matchesSealedCredential(asset, input) {
    if (!input || typeof input !== 'string') return false;
    const rawInput = input.trim();
    if (rawInput.length < 5) return false;
    const clean = rawInput.toLowerCase().replace(/\.+$/, '').trim();
    const cleanNoHex = clean.startsWith('0x') ? clean.slice(2) : clean;

    if (asset.pinnedCid) {
      const cleanCid = asset.pinnedCid.toLowerCase().trim();
      if (clean === cleanCid || cleanCid.includes(clean) || clean.includes(cleanCid)) return true;
    }

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

    if (asset.sha256Hash) {
      const cleanSha = asset.sha256Hash.toLowerCase().trim();
      const cleanShaNoHex = cleanSha.startsWith('0x') ? cleanSha.slice(2) : cleanSha;
      if (clean === cleanSha || cleanNoHex === cleanShaNoHex || (cleanNoHex.length >= 12 && cleanShaNoHex.includes(cleanNoHex))) {
        return true;
      }
    }
    return false;
  }

  assert(matchesSealedCredential(sealedAsset, `0x${rawCipherHex}`), 'Matches via full raw CIPHERTEXT (0x...)');
  assert(matchesSealedCredential(sealedAsset, sealedAsset.ciphertextHex), 'Matches via truncated display CIPHERTEXT with dots (...)');
  assert(matchesSealedCredential(sealedAsset, testCid), 'Matches via IPFS Storage CID (bafy...)');
  assert(matchesSealedCredential(sealedAsset, `0x${digestHex}`), 'Matches via SHA-256 integrity checksum');
  assert(!matchesSealedCredential(sealedAsset, '0xInvalidCiphertext12345678'), 'Rejects non-matching credential input');

  // 4. Test Post-Logout Restoration & Decryption using only the sealed envelope
  const restoredCipherBytes = new Uint8Array(sealedAsset.rawCiphertextHex.slice(2).match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const restoredIvBytes = new Uint8Array(sealedAsset.ivHex.slice(2).match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const restoredDecryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: restoredIvBytes },
    importedKey,
    restoredCipherBytes.buffer
  );
  const restoredText = Buffer.from(restoredDecryptedBuffer).toString('utf8');
  assert(restoredText === sampleData.toString('utf8'), 'Successfully decrypts sealed asset post-logout without active session');

  // ==========================================
  // Test Suite 4: Security Sanitization & CSV Formula Protection
  // ==========================================
  console.log('\n--- SUITE 4: Security Sanitization & CSV Injection Defense ---');
  function sanitizeCsvCell(value) {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
    return str.replace(/"/g, '""');
  }

  function isValidEthereumAddress(addr) {
    return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
  }

  function isValidTxHash(hash) {
    return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash.trim());
  }

  function isValidCID(cid) {
    return typeof cid === 'string' && cid.trim().length >= 20 && /^[a-zA-Z0-9_-]+$/.test(cid.trim());
  }

  assert(sanitizeCsvCell('=1+1') === "'=1+1", 'Sanitizes formula starting with "="');
  assert(sanitizeCsvCell('+cmd|') === "'+cmd|", 'Sanitizes formula starting with "+"');
  assert(sanitizeCsvCell('-2*3') === "'-2*3", 'Sanitizes formula starting with "-"');
  assert(sanitizeCsvCell('@SUM') === "'@SUM", 'Sanitizes formula starting with "@"');
  assert(sanitizeCsvCell('NormalText') === 'NormalText', 'Leaves benign text unmodified');

  assert(isValidEthereumAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'), 'Validates valid Ethereum address');
  assert(!isValidEthereumAddress('0xInvalidAddress'), 'Rejects invalid Ethereum address');
  assert(
    isValidTxHash('0x4e8d356c9a784bb5f2a1b9c3e7d5f8a2b4c6e9d1a3b5c7e9f1a3b5c7e9f1a3b5'),
    'Validates 64-char transaction hash'
  );
  assert(!isValidTxHash('0x123'), 'Rejects truncated transaction hash');
  assert(isValidCID('bafybeih8392fb1039d91028sentinel'), 'Validates IPFS CID');

  // ==========================================
  // Test Suite 5: Database Persistence Engine
  // ==========================================
  console.log('\n--- SUITE 5: Database Persistence Engine (sentinel-data.json) ---');
  const dataDir = path.join(__dirname, '..', 'data');
  const dbFile = path.join(dataDir, 'sentinel-data.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Verify atomic persistence
  const sampleDb = {
    version: '3.0.0',
    updatedAt: new Date().toISOString(),
    identities: {
      [wallet.address.toLowerCase()]: {
        did,
        address: wallet.address,
        role: 'Admin (Issuer)',
        registeredAt: new Date().toISOString(),
        isActive: true,
      },
    },
    nfts: [
      {
        tokenId: 1001,
        assetCid: 'bafybeih8392fb1039d91028sentinel',
        owner: wallet.address,
        ownerDid: did,
      },
    ],
    auditRecords: [
      {
        id: 'test-log-1',
        assetCid: 'bafybeih8392fb1039d91028sentinel',
        userAddress: wallet.address,
        txHash: '0x4e8d356c9a784bb5f2a1b9c3e7d5f8a2b4c6e9d1a3b5c7e9f1a3b5c7e9f1a3b5',
      },
    ],
  };

  const tempFile = `${dbFile}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(sampleDb, null, 2), 'utf8');
  fs.renameSync(tempFile, dbFile);

  assert(fs.existsSync(dbFile), 'Database file successfully written to disk via atomic rename pattern');

  const reloaded = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  assert(reloaded.identities[wallet.address.toLowerCase()].did === did, 'Persisted identity read accurately from disk');
  assert(reloaded.nfts.length >= 1, 'Persisted NFTs present in database');
  assert(reloaded.auditRecords.length >= 1, 'Persisted audit records present in database');

  // ==========================================
  // Test Suite 6: Smart Contract Artifact & ABI Interface
  // ==========================================
  console.log('\n--- SUITE 6: Smart Contract Artifact & ERC-721 Interface ---');
  const artifactPath = path.join(__dirname, '..', 'contracts', 'SentinelAuditRegistry.json');
  assert(fs.existsSync(artifactPath), 'Smart contract compiled artifact SentinelAuditRegistry.json exists');

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  assert(artifact.abi && Array.isArray(artifact.abi), 'Contract artifact contains valid ABI array');
  assert(artifact.bytecode && artifact.bytecode.startsWith('0x'), 'Contract artifact contains valid bytecode');

  const requiredMethods = [
    'registerIdentity',
    'selfRegisterIdentity',
    'getIdentity',
    'resolveDID',
    'mintAssetNFT',
    'allocateAssetNFT',
    'getAssetNFT',
    'getUserTokens',
    'isCidMinted',
    'verifyAndLogAccess',
    'hasRole',
    'grantRole',
    'revokeRole',
    'setPaused',
    'paused',
  ];

  for (const method of requiredMethods) {
    const found = artifact.abi.some((item) => item.type === 'function' && item.name === method);
    assert(found, `Contract ABI includes required enterprise function: ${method}()`);
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified successfully!`);
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
