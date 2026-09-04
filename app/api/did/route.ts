import { NextResponse } from 'next/server';
import { createDIDDocument, verifyDIDSignature } from '@/lib/did';
import { DIDDocument, UserRole } from '@/lib/types';

// In-memory DID registry store (can be connected to a database or indexed from Polygon Amoy)
interface StoredIdentity {
  did: string;
  address: string;
  role: UserRole;
  didDocument: DIDDocument;
  registeredAt: string;
  isActive: boolean;
}

// Initialized with clean, empty store (no mock or default user details)
const GLOBAL_DID_STORE = new Map<string, StoredIdentity>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const did = searchParams.get('did');

  if (address) {
    const identity = GLOBAL_DID_STORE.get(address.toLowerCase());
    if (identity) {
      return NextResponse.json({ success: true, identity });
    }
    return NextResponse.json(
      { success: false, error: 'Identity not registered. Authenticate wallet to establish DID session.' },
      { status: 404 }
    );
  }

  if (did) {
    for (const identity of Array.from(GLOBAL_DID_STORE.values())) {
      if (identity.did.toLowerCase() === did.toLowerCase()) {
        return NextResponse.json({ success: true, identity });
      }
    }
    return NextResponse.json({ success: false, error: 'DID not found' }, { status: 404 });
  }

  // Return all registered identities
  return NextResponse.json({
    total: GLOBAL_DID_STORE.size,
    identities: Array.from(GLOBAL_DID_STORE.values()),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, role, challenge, signature } = body;

    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const assignedRole: UserRole = role || 'User (Asset Owner)';

    // Verify cryptographic proof if provided
    let isCryptographicallyVerified = false;
    if (challenge && signature) {
      isCryptographicallyVerified = verifyDIDSignature(challenge, signature, address);
      if (!isCryptographicallyVerified) {
        return NextResponse.json(
          { error: 'Cryptographic signature verification failed for DID authentication' },
          { status: 401 }
        );
      }
    }

    const didDocument = createDIDDocument(address, assignedRole);
    const identity: StoredIdentity = {
      did: didDocument.id,
      address,
      role: assignedRole,
      didDocument,
      registeredAt: new Date().toISOString(),
      isActive: true,
    };

    GLOBAL_DID_STORE.set(address.toLowerCase(), identity);

    return NextResponse.json({
      success: true,
      verified: isCryptographicallyVerified,
      identity,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to register decentralized identity' },
      { status: 500 }
    );
  }
}
