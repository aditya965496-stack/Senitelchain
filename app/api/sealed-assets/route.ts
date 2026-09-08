import { NextResponse } from 'next/server';
import { StoredSealedAsset } from '@/lib/types';
import { saveSealedAsset, getSealedAssetByQuery, listSealedAssets } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('cid') || searchParams.get('cipher') || undefined;

    if (query) {
      const asset = getSealedAssetByQuery(query);
      if (asset) {
        return NextResponse.json({ success: true, asset });
      }
      return NextResponse.json(
        { success: false, error: 'No sealed asset matches the provided credential or IPFS Storage CID' },
        { status: 404 }
      );
    }

    const assets = listSealedAssets();
    return NextResponse.json({
      success: true,
      total: assets.length,
      assets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to query sealed asset vault' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: StoredSealedAsset = await request.json();

    if (!body.rawCiphertextHex || !body.keyHex || !body.ivHex || !body.sha256Hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required sealed envelope parameters (rawCiphertextHex, keyHex, ivHex, sha256Hash)' },
        { status: 400 }
      );
    }

    const saved = saveSealedAsset(body);
    return NextResponse.json({ success: true, asset: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to persist sealed asset' },
      { status: 500 }
    );
  }
}
