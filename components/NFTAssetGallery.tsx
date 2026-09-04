import React, { useState } from 'react';
import { AssetNFT, UserRole } from '@/lib/types';
import {
  LayersIcon,
  SearchIcon,
  ExternalLinkIcon,
  EyeIcon,
  TagIcon,
  CopyIcon,
  CheckIcon,
} from './Icons';

interface NFTAssetGalleryProps {
  nfts: AssetNFT[];
  currentAddress: string | null;
  userRole: UserRole;
  isProcessing: boolean;
  onReallocateAsset?: (tokenId: number, newOwner: string, newOwnerDid: string) => Promise<void>;
  onRefresh?: () => void;
}

export const NFTAssetGallery: React.FC<NFTAssetGalleryProps> = ({
  nfts,
  currentAddress,
  userRole,
  isProcessing,
  onReallocateAsset,
  onRefresh,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<AssetNFT | null>(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [reallocateTokenId, setReallocateTokenId] = useState<number | null>(null);
  const [targetAddress, setTargetAddress] = useState('');
  const [reallocateStatus, setReallocateStatus] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canReallocate = userRole.includes('Admin') || userRole.includes('Manager');

  const filteredNFTs = nfts.filter((nft) => {
    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'my' && currentAddress && nft.owner.toLowerCase() === currentAddress.toLowerCase());

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      String(nft.tokenId).includes(q) ||
      nft.assetCid.toLowerCase().includes(q) ||
      nft.owner.toLowerCase().includes(q) ||
      nft.ownerDid.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenMetadata = (nft: AssetNFT) => {
    setSelectedNFT(nft);
    setIsMetadataModalOpen(true);
  };

  const handleExecuteReallocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reallocateTokenId || !targetAddress || !targetAddress.startsWith('0x')) {
      setReallocateStatus('Please enter a valid Ethereum address (0x...)');
      return;
    }

    if (onReallocateAsset) {
      try {
        setReallocateStatus('Broadcasting reallocation transaction to Polygon Amoy...');
        const targetDid = `did:sentinel:80002:${targetAddress.toLowerCase()}`;
        await onReallocateAsset(reallocateTokenId, targetAddress, targetDid);
        setReallocateStatus('Reallocation confirmed on-chain!');
        setTimeout(() => {
          setReallocateTokenId(null);
          setTargetAddress('');
          setReallocateStatus('');
        }, 1500);
      } catch (err: any) {
        setReallocateStatus(`Reallocation failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Digital Asset NFT Inventory (ERC-721)
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {filteredNFTs.length} Assets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically unique digital asset NFTs directly allocated to self-sovereign DIDs.
          </p>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Assets ({nfts.length})
            </button>
            <button
              onClick={() => setFilterMode('my')}
              disabled={!currentAddress}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40 ${
                filterMode === 'my'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Portfolio
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Token / CID / DID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-200/90 rounded-xl bg-slate-50/70 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      {filteredNFTs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-sans border border-dashed border-slate-200 rounded-xl">
          <LayersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs">No digital asset NFTs found matching current criteria.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Mint new asset NFTs using the Asset Ingestion Gateway and On-Chain Audit Panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNFTs.map((nft) => {
            const isOwner = currentAddress && nft.owner.toLowerCase() === currentAddress.toLowerCase();

            return (
              <div
                key={nft.tokenId}
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 transition-all space-y-3 shadow-2xs hover:shadow-sm"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                    #{nft.tokenId}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isOwner && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                        OWNED
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-200/70 text-slate-700 font-mono px-2 py-0.5 rounded-full">
                      ERC-721
                    </span>
                  </div>
                </div>

                {/* CID Information */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    IPFS Content Identifier
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-800 bg-white p-2 rounded-lg border border-slate-200/60">
                    <span className="truncate max-w-[170px]" title={nft.assetCid}>
                      {nft.assetCid}
                    </span>
                    <button
                      onClick={() => handleCopy(nft.assetCid, `cid-${nft.tokenId}`)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy CID"
                    >
                      {copiedId === `cid-${nft.tokenId}` ? (
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Owner & DID Details */}
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Owner:</span>
                    <strong className="text-slate-900">{formatAddress(nft.owner)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 truncate" title={nft.ownerDid}>
                    <span className="text-slate-400">DID:</span>
                    <span className="truncate max-w-[150px] text-slate-700">{nft.ownerDid}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenMetadata(nft)}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="View ERC-721 Metadata JSON"
                  >
                    <EyeIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Metadata</span>
                  </button>

                  {canReallocate && onReallocateAsset && (
                    <button
                      onClick={() => {
                        setReallocateTokenId(nft.tokenId);
                        setTargetAddress('');
                        setReallocateStatus('');
                      }}
                      disabled={isProcessing}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <TagIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Reallocate</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reallocation Modal */}
      {reallocateTokenId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Reallocate Asset NFT #{reallocateTokenId}
              </h3>
              <button
                onClick={() => setReallocateTokenId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteReallocation} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Recipient Wallet Address
                </label>
                <input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x... (Recipient Address)"
                  required
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50/70 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Recipient will automatically be assigned Decentralized Identifier (DID) on Polygon Amoy.
                </p>
              </div>

              {reallocateStatus && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 break-all">
                  {reallocateStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReallocateTokenId(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-40"
                >
                  {isProcessing ? 'Confirming on Blockchain...' : 'Execute On-Chain Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metadata Viewer Modal */}
      {isMetadataModalOpen && selectedNFT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                  #{selectedNFT.tokenId}
                </span>
                <h3 className="text-sm font-bold text-slate-900">ERC-721 Asset Metadata</h3>
              </div>
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-800">
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] leading-relaxed overflow-x-auto shadow-inner">
                <pre>
                  <code>
                    {JSON.stringify(
                      {
                        name: `Sentinel Asset #${selectedNFT.tokenId}`,
                        description:
                          'Enterprise Zero-Trust encrypted digital asset NFT governed by SentinelChain smart contracts.',
                        image: `https://gateway.pinata.cloud/ipfs/${selectedNFT.assetCid}`,
                        properties: {
                          assetCid: selectedNFT.assetCid,
                          sha256Digest: selectedNFT.sha256Digest,
                          owner: selectedNFT.owner,
                          ownerDid: selectedNFT.ownerDid,
                          creator: selectedNFT.creator,
                          mintedAt: selectedNFT.mintedAt,
                          contractNetwork: 'Polygon Amoy (80002)',
                        },
                      },
                      null,
                      2
                    )}
                  </code>
                </pre>
              </div>
            </div>

            <div className="flex justify-end p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
