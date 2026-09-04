import { NextResponse } from 'next/server';
import { AuditRecord } from '@/lib/types';
import { saveAuditRecord, listAuditRecords } from '@/lib/db';
import { sanitizeCsvCell, isValidTxHash } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('q') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const results = listAuditRecords({ role, search, limit });

    // Export as CSV with formula injection protection
    if (format === 'csv') {
      const headers =
        'ID,Timestamp,Action_Type,Asset_CID,Token_ID,Actor_Address,DID,Role,Gas_Used,Block_Number,Status,Tx_Hash\n';

      const rows = results
        .map((r) => {
          const id = sanitizeCsvCell(r.id);
          const timestamp = sanitizeCsvCell(r.timestamp);
          const action = sanitizeCsvCell(r.actionType || 'Access Logged');
          const cid = sanitizeCsvCell(r.assetCid);
          const tokenId = sanitizeCsvCell(r.tokenId || 'N/A');
          const address = sanitizeCsvCell(r.userAddress);
          const did = sanitizeCsvCell(r.did || 'N/A');
          const recRole = sanitizeCsvCell(r.role);
          const gas = sanitizeCsvCell(r.gasUsed);
          const block = sanitizeCsvCell(r.blockNumber || 'N/A');
          const status = sanitizeCsvCell(r.status);
          const tx = sanitizeCsvCell(r.txHash);

          return `"${id}","${timestamp}","${action}","${cid}","${tokenId}","${address}","${did}","${recRole}","${gas}","${block}","${status}","${tx}"`;
        })
        .join('\n');

      return new Response(headers + rows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="sentinel-audit-trail.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      records: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to query audit trail' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: Partial<AuditRecord> = await request.json();

    if (!body.assetCid || !body.txHash) {
      return NextResponse.json(
        { success: false, error: 'assetCid and txHash are required parameters' },
        { status: 400 }
      );
    }

    if (!isValidTxHash(body.txHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum transaction hash format (must be 0x... 64 hex characters)' },
        { status: 400 }
      );
    }

    const newRecord: AuditRecord = {
      id: body.id || `log-${Date.now()}`,
      timestamp:
        body.timestamp ||
        new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      assetCid: body.assetCid.trim(),
      userAddress: body.userAddress || '0xUnknown',
      role: body.role || 'User (Asset Owner)',
      txHash: body.txHash.trim(),
      gasUsed: body.gasUsed || 'N/A',
      blockNumber: body.blockNumber,
      status: body.status || 'Verified',
      actionType: body.actionType || 'Access Verified',
      tokenId: body.tokenId,
      did: body.did,
      explorerUrl:
        body.explorerUrl || `https://amoy.polygonscan.com/tx/${body.txHash.trim()}`,
    };

    saveAuditRecord(newRecord);

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record audit entry' },
      { status: 500 }
    );
  }
}
