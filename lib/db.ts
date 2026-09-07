import fs from 'fs';
import path from 'path';
import type { StoredIdentity, AssetNFT, AuditRecord, UserRole } from './types';

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  identities: Record<string, StoredIdentity>; // keyed by lowercase address
  nfts: AssetNFT[];
  auditRecords: AuditRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sentinel-data.json');

// Default initial seed data
function getInitialSeedData(): DatabaseSchema {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  return {
    version: '3.0.0',
    updatedAt: new Date().toISOString(),
    identities: {},
    nfts: [
      {
        tokenId: 1001,
        assetCid: 'bafybeih8392fb1039d91028sentinel',
        sha256Digest: '0x47e96b175c4fc3468f356e2e50e063778502fbf7ef443913bb3c5164fdb6f578',
        owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        ownerDid: 'did:sentinel:80002:0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        tokenUri: 'ipfs://bafybeih8392fb1039d91028sentinel/metadata.json',
        mintedAt: Math.floor(Date.now() / 1000) - 86400,
        isAllocated: true,
      },
    ],
    auditRecords: [
      {
        id: 'seed-genesis-audit-01',
        timestamp,
        assetCid: 'bafybeih8392fb1039d91028sentinel',
        userAddress: '0x7099...79C8',
        role: 'Admin (Issuer)',
        txHash: '0x4e8d356c9a784bb5f2a1b9c3e7d5f8a2b4c6e9d1a3b5c7e9f1a3b5c7e9f1a3b5',
        gasUsed: '84,312 gas units',
        blockNumber: 1542109,
        status: 'Verified',
        actionType: 'NFT Minted',
        tokenId: 1001,
        did: 'did:sentinel:80002:0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        explorerUrl: 'https://amoy.polygonscan.com/tx/0x4e8d356c9a784bb5f2a1b9c3e7d5f8a2b4c6e9d1a3b5c7e9f1a3b5c7e9f1a3b5',
      },
    ],
  };
}

let inMemoryCache: DatabaseSchema | null = null;

/**
 * Initializes database directory and loads data into memory
 */
function loadDatabase(): DatabaseSchema {
  if (inMemoryCache) {
    return inMemoryCache;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      inMemoryCache = JSON.parse(content);
      return inMemoryCache!;
    }
  } catch (err) {
    console.warn('Failed to load database file, falling back to seed:', err);
  }

  // Initialize with seed
  inMemoryCache = getInitialSeedData();
  persistDatabase(inMemoryCache);
  return inMemoryCache;
}

/**
 * Atomically writes database to disk to prevent corruptions during concurrent writes
 */
function persistDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    data.updatedAt = new Date().toISOString();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database file to disk:', err);
  }
}

// ==========================================
// Identity Operations
// ==========================================

export function saveIdentity(identity: StoredIdentity): StoredIdentity {
  const db = loadDatabase();
  const key = identity.address.toLowerCase();
  db.identities[key] = identity;
  persistDatabase(db);
  return identity;
}

export function getIdentityByAddress(address: string): StoredIdentity | null {
  const db = loadDatabase();
  return db.identities[address.toLowerCase()] || null;
}

export function getIdentityByDID(did: string): StoredIdentity | null {
  const db = loadDatabase();
  const cleanDid = did.toLowerCase();
  for (const identity of Object.values(db.identities)) {
    if (identity.did.toLowerCase() === cleanDid) {
      return identity;
    }
  }
  return null;
}

export function listIdentities(): StoredIdentity[] {
  const db = loadDatabase();
  return Object.values(db.identities);
}

// ==========================================
// NFT Asset Operations
// ==========================================

export function saveNFT(nft: AssetNFT): AssetNFT {
  const db = loadDatabase();
  const existingIndex = db.nfts.findIndex(
    (n) => n.assetCid.toLowerCase() === nft.assetCid.toLowerCase() || n.tokenId === nft.tokenId
  );

  if (existingIndex >= 0) {
    db.nfts[existingIndex] = nft;
  } else {
    db.nfts.unshift(nft);
  }

  persistDatabase(db);
  return nft;
}

export function getNFTByTokenId(tokenId: number): AssetNFT | null {
  const db = loadDatabase();
  return db.nfts.find((n) => n.tokenId === tokenId) || null;
}

export function getNFTByCID(cid: string): AssetNFT | null {
  const db = loadDatabase();
  const cleanCid = cid.toLowerCase();
  return db.nfts.find((n) => n.assetCid.toLowerCase() === cleanCid) || null;
}

export function getNFTsByOwner(ownerAddress: string): AssetNFT[] {
  const db = loadDatabase();
  const cleanOwner = ownerAddress.toLowerCase();
  return db.nfts.filter((n) => n.owner.toLowerCase() === cleanOwner);
}

export function listNFTs(): AssetNFT[] {
  const db = loadDatabase();
  return db.nfts;
}

export function updateNFTOwner(tokenId: number, newOwner: string, newOwnerDid: string): AssetNFT | null {
  const db = loadDatabase();
  const nft = db.nfts.find((n) => n.tokenId === tokenId);
  if (!nft) return null;

  nft.owner = newOwner;
  nft.ownerDid = newOwnerDid;
  persistDatabase(db);
  return nft;
}

// ==========================================
// Audit Record Operations
// ==========================================

export function saveAuditRecord(record: AuditRecord): AuditRecord {
  const db = loadDatabase();
  // Unshift to place newest records at the top
  db.auditRecords.unshift(record);
  persistDatabase(db);
  return record;
}

export function listAuditRecords(options?: {
  role?: string;
  search?: string;
  limit?: number;
}): AuditRecord[] {
  const db = loadDatabase();
  let results = [...db.auditRecords];

  if (options?.role && options.role !== 'All') {
    const r = options.role.toLowerCase();
    results = results.filter((rec) => rec.role.toLowerCase().includes(r));
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    results = results.filter(
      (rec) =>
        rec.assetCid.toLowerCase().includes(q) ||
        rec.userAddress.toLowerCase().includes(q) ||
        rec.txHash.toLowerCase().includes(q) ||
        (rec.actionType && rec.actionType.toLowerCase().includes(q)) ||
        (rec.did && rec.did.toLowerCase().includes(q))
    );
  }

  if (options?.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  return results;
}

// ==========================================
// System Stats
// ==========================================

export function getDatabaseStats() {
  const db = loadDatabase();
  return {
    totalIdentities: Object.keys(db.identities).length,
    totalNFTs: db.nfts.length,
    totalAuditRecords: db.auditRecords.length,
    lastUpdated: db.updatedAt,
  };
}
