import { NextResponse } from 'next/server';
import { AssetNFT } from '@/lib/types';

// In-memory persistent NFT asset registry (initialized clean without default user details)
const GLOBAL_NFT_STORE: AssetNFT[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const tokenId = searchParams.get('tokenId');
  const cid = searchParams.get('cid');

  if (tokenId) {
    const nft = GLOBAL_NFT_STORE.find((n) => n.tokenId === Number(tokenId));
    if (nft) return NextResponse.json({ success: true, nft });
    return NextResponse.json({ error: 'NFT Token not found' }, { status: 404 });
  }

  if (cid) {
    const nft = GLOBAL_NFT_STORE.find((n) => n.assetCid.toLowerCase() === cid.toLowerCase());
    if (nft) return NextResponse.json({ success: true, nft });
    return NextResponse.json({ error: 'NFT Asset CID not found' }, { status: 404 });
  }

  if (owner) {
    const tokens = GLOBAL_NFT_STORE.filter((n) => n.owner.toLowerCase() === owner.toLowerCase());
    return NextResponse.json({ success: true, total: tokens.length, tokens });
  }

  return NextResponse.json({
    total: GLOBAL_NFT_STORE.length,
    tokens: GLOBAL_NFT_STORE,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assetCid, sha256Digest, owner, ownerDid, creator, tokenUri, tokenId } = body;

    if (!assetCid || !owner) {
      return NextResponse.json({ error: 'Asset CID and owner address are required' }, { status: 400 });
    }

    // Check if CID already minted
    const existing = GLOBAL_NFT_STORE.find((n) => n.assetCid.toLowerCase() === assetCid.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Asset NFT with this CID has already been minted' }, { status: 409 });
    }

    const nextId = tokenId || (GLOBAL_NFT_STORE.length > 0 ? Math.max(...GLOBAL_NFT_STORE.map((n) => n.tokenId)) + 1 : 1001);

    const newNFT: AssetNFT = {
      tokenId: nextId,
      assetCid,
      sha256Digest: sha256Digest || '0x00',
      owner,
      ownerDid: ownerDid || `did:sentinel:80002:${owner.toLowerCase()}`,
      creator: creator || owner,
      tokenUri: tokenUri || `ipfs://${assetCid}/metadata.json`,
      mintedAt: Math.floor(Date.now() / 1000),
      isAllocated: true,
    };

    GLOBAL_NFT_STORE.unshift(newNFT);

    return NextResponse.json({ success: true, nft: newNFT });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to record NFT asset minting' },
      { status: 500 }
    );
  }
}
