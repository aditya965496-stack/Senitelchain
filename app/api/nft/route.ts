import { NextResponse } from 'next/server';
import { AssetNFT } from '@/lib/types';
import {
  saveNFT,
  getNFTByTokenId,
  getNFTByCID,
  getNFTsByOwner,
  listNFTs,
  updateNFTOwner,
} from '@/lib/db';
import { isValidEthereumAddress, isValidCID } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const tokenId = searchParams.get('tokenId');
    const cid = searchParams.get('cid');
    const search = searchParams.get('q');

    if (tokenId) {
      const parsedId = parseInt(tokenId, 10);
      if (isNaN(parsedId)) {
        return NextResponse.json({ success: false, error: 'Invalid tokenId parameter' }, { status: 400 });
      }
      const nft = getNFTByTokenId(parsedId);
      if (nft) return NextResponse.json({ success: true, nft });
      return NextResponse.json({ success: false, error: 'NFT Token not found' }, { status: 404 });
    }

    if (cid) {
      const nft = getNFTByCID(cid);
      if (nft) return NextResponse.json({ success: true, nft });
      return NextResponse.json({ success: false, error: 'NFT Asset CID not found' }, { status: 404 });
    }

    if (owner) {
      if (!isValidEthereumAddress(owner)) {
        return NextResponse.json({ success: false, error: 'Invalid owner address format' }, { status: 400 });
      }
      const tokens = getNFTsByOwner(owner);
      return NextResponse.json({ success: true, total: tokens.length, tokens });
    }

    let allTokens = listNFTs();

    if (search) {
      const q = search.toLowerCase();
      allTokens = allTokens.filter(
        (n) =>
          n.assetCid.toLowerCase().includes(q) ||
          n.owner.toLowerCase().includes(q) ||
          n.ownerDid.toLowerCase().includes(q) ||
          String(n.tokenId).includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      total: allTokens.length,
      tokens: allTokens,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve NFT assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetCid, sha256Digest, owner, ownerDid, creator, tokenUri, tokenId } = body;

    if (!assetCid || !isValidCID(assetCid)) {
      return NextResponse.json({ success: false, error: 'Valid Asset CID is required' }, { status: 400 });
    }

    if (!owner || !isValidEthereumAddress(owner)) {
      return NextResponse.json({ success: false, error: 'Valid owner wallet address is required' }, { status: 400 });
    }

    // Check if CID already minted
    const existing = getNFTByCID(assetCid);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset NFT with this CID has already been minted', nft: existing },
        { status: 409 }
      );
    }

    const allTokens = listNFTs();
    const nextId =
      tokenId || (allTokens.length > 0 ? Math.max(...allTokens.map((n) => n.tokenId)) + 1 : 1001);

    const newNFT: AssetNFT = {
      tokenId: nextId,
      assetCid: assetCid.trim(),
      sha256Digest: sha256Digest || '0x00',
      owner,
      ownerDid: ownerDid || `did:sentinel:80002:${owner.toLowerCase()}`,
      creator: creator || owner,
      tokenUri: tokenUri || `ipfs://${assetCid}/metadata.json`,
      mintedAt: Math.floor(Date.now() / 1000),
      isAllocated: true,
    };

    saveNFT(newNFT);

    return NextResponse.json({ success: true, nft: newNFT });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record NFT asset minting' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tokenId, newOwner, newOwnerDid } = body;

    if (!tokenId || !newOwner || !isValidEthereumAddress(newOwner)) {
      return NextResponse.json(
        { success: false, error: 'tokenId and valid newOwner address are required' },
        { status: 400 }
      );
    }

    const targetDid = newOwnerDid || `did:sentinel:80002:${newOwner.toLowerCase()}`;
    const updated = updateNFTOwner(Number(tokenId), newOwner, targetDid);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Token not found for reallocation' }, { status: 404 });
    }

    return NextResponse.json({ success: true, nft: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update NFT ownership' },
      { status: 500 }
    );
  }
}
