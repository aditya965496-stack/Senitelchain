import { NextResponse } from 'next/server';
import { createDIDDocument, verifyDIDSignature } from '@/lib/did';
import { StoredIdentity, UserRole } from '@/lib/types';
import {
  saveIdentity,
  getIdentityByAddress,
  getIdentityByDID,
  listIdentities,
} from '@/lib/db';
import {
  isValidEthereumAddress,
  isValidDID,
  isValidRole,
} from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const did = searchParams.get('did');

    if (address) {
      if (!isValidEthereumAddress(address)) {
        return NextResponse.json(
          { success: false, error: 'Invalid Ethereum address format (must be 0x... 40 hex characters).' },
          { status: 400 }
        );
      }
      const identity = getIdentityByAddress(address);
      if (identity) {
        return NextResponse.json({ success: true, identity });
      }
      return NextResponse.json(
        { success: false, error: 'Identity not registered. Authenticate wallet to establish DID session.' },
        { status: 404 }
      );
    }

    if (did) {
      if (!isValidDID(did)) {
        return NextResponse.json(
          { success: false, error: 'Invalid W3C Sentinel DID format.' },
          { status: 400 }
        );
      }
      const identity = getIdentityByDID(did);
      if (identity) {
        return NextResponse.json({ success: true, identity });
      }
      return NextResponse.json({ success: false, error: 'DID not found' }, { status: 404 });
    }

    // Return all registered identities
    const identities = listIdentities();
    return NextResponse.json({
      success: true,
      total: identities.length,
      identities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve identity data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, role, challenge, signature } = body;

    if (!isValidEthereumAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing Ethereum wallet address' },
        { status: 400 }
      );
    }

    const assignedRole: UserRole = isValidRole(role) ? role : 'User (Asset Owner)';

    // Enforce cryptographic signature verification
    let isCryptographicallyVerified = false;
    if (challenge && signature) {
      isCryptographicallyVerified = verifyDIDSignature(challenge, signature, address);
      if (!isCryptographicallyVerified) {
        return NextResponse.json(
          { success: false, error: 'Cryptographic signature verification failed for DID authentication' },
          { status: 401 }
        );
      }
    } else if (assignedRole.includes('Admin') || assignedRole.includes('Manager')) {
      // Elevated roles require signed cryptographic proof
      return NextResponse.json(
        {
          success: false,
          error: `Cryptographic signature proof is mandatory for establishing ${assignedRole} sessions.`,
        },
        { status: 401 }
      );
    }

    const didDocument = createDIDDocument(address, assignedRole);
    const identity: StoredIdentity = {
      did: didDocument.id,
      address,
      role: assignedRole,
      didDocument,
      registeredAt: new Date().toISOString(),
      isActive: true,
      isCryptographicallyVerified,
    };

    saveIdentity(identity);

    return NextResponse.json({
      success: true,
      verified: isCryptographicallyVerified,
      identity,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register decentralized identity' },
      { status: 500 }
    );
  }
}
