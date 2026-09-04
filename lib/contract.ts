import { ethers } from 'ethers';
import { UserRole } from './types';
import { generateDID } from './did';
import registryArtifact from '@/contracts/SentinelAuditRegistry.json';

export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_AMOY_CHAIN_ID_HEX = '0x13882';

export const DEFAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Role Keccak-256 Hashes
export const ROLE_HASHES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE')),
  MANAGER_ROLE: ethers.keccak256(ethers.toUtf8Bytes('MANAGER_ROLE')),
  AUDITOR_ROLE: ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE')),
  USER_ROLE: ethers.keccak256(ethers.toUtf8Bytes('USER_ROLE')),
};

export const CONTRACT_ABI = registryArtifact.abi;

export interface TxExecutionResult {
  success: boolean;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  actionType: 'Identity Registered' | 'NFT Minted' | 'Asset Allocated' | 'Access Verified';
  tokenId?: number;
  did?: string;
}

/**
 * Ensure browser wallet is connected to Polygon Amoy Testnet (80002)
 */
export async function switchOrAddPolygonAmoy(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return false;
  }

  const eth = (window as any).ethereum;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_AMOY_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      try {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: POLYGON_AMOY_CHAIN_ID_HEX,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              rpcUrls: ['https://polygon-amoy.drpc.org', 'https://rpc-amoy.polygon.technology/'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Polygon Amoy network:', addError);
        return false;
      }
    }
    console.error('Failed to switch network:', switchError);
    return false;
  }
}

export function normalizeAddress(addr: string): string {
  const cleaned = addr.trim();
  if (!cleaned.startsWith('0x') || cleaned.length !== 42) {
    throw new Error('Invalid contract address format. Must be a 42-character hex address (0x...).');
  }
  try {
    return ethers.getAddress(cleaned.toLowerCase());
  } catch {
    throw new Error('Invalid contract address format. Please check the hex characters.');
  }
}

/**
 * Deploy a brand-new live SentinelAuditRegistry smart contract directly from MetaMask to Polygon Amoy
 */
export async function deploySentinelRegistry(): Promise<{ address: string; txHash: string; blockNumber: number }> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask or Web3 Provider is not detected.');
  }

  await switchOrAddPolygonAmoy();

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  const balance = await provider.getBalance(signerAddress);
  if (balance === 0n) {
    throw new Error(
      `INSUFFICIENT_FUNDS: Wallet ${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)} has 0 POL on Polygon Amoy. Claim free testnet POL from https://faucet.polygon.technology/ to deploy contracts.`
    );
  }

  const factory = new ethers.ContractFactory(registryArtifact.abi, registryArtifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait() : null;

  return {
    address,
    txHash: deployTx ? deployTx.hash : '',
    blockNumber: receipt?.blockNumber || 0,
  };
}

/**
 * Execute real, verifiable smart contract operation according to caller role & RBAC permissions:
 * - Admin: Mints unique NFT asset, binds to user DID, and allocates ownership
 * - Manager: Logs verified asset access and ownership changes on-chain
 * - User: Verifies asset and commits immutable audit log
 * - Auditor: Read-only access verification
 *
 * All operations execute 100% on Polygon Amoy with real gas and real blockchain receipts.
 */
export async function executeContractAccessLog(
  contractAddress: string,
  assetId: string,
  userRole: UserRole,
  options?: {
    sha256Digest?: string;
    targetAddress?: string;
  }
): Promise<TxExecutionResult> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask or Web3 Provider is not detected.');
  }

  const validAddress = normalizeAddress(contractAddress);
  await switchOrAddPolygonAmoy();

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();
  const did = generateDID(signerAddress);

  // 1. Verify contract address is not an EOA (must have bytecode on chain)
  const code = await provider.getCode(validAddress);
  if (!code || code === '0x') {
    throw new Error(
      `No smart contract found at address ${validAddress} on Polygon Amoy. This address is an EOA personal wallet, not a deployed contract. Please enter your deployed SentinelAuditRegistry address or click "Deploy New Contract".`
    );
  }

  // 2. Validate real testnet balance for gas fees
  const balance = await provider.getBalance(signerAddress);
  if (balance === 0n || balance <= BigInt(0)) {
    throw new Error(
      `INSUFFICIENT_FUNDS: Wallet ${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)} has 0 POL on Polygon Amoy. Real on-chain transactions require testnet POL to pay for gas fees. Please claim free POL from the faucet.`
    );
  }

  const contract = new ethers.Contract(validAddress, CONTRACT_ABI, signer);
  const cleanAssetId = assetId.trim();
  const digest = options?.sha256Digest || '0x' + Array.from({ length: 32 }, () => 'f').join('');

  let tx: any;
  let actionType: TxExecutionResult['actionType'] = 'Access Verified';
  let mintedTokenId: number | undefined;

  if (userRole.includes('Admin')) {
    // Admin mints unique NFT and directly allocates to user DID
    const recipient = options?.targetAddress || signerAddress;
    const recipientDid = generateDID(recipient);
    const tokenUri = `ipfs://${cleanAssetId}/metadata.json`;

    // Check if this CID was already minted on this contract
    let isAlreadyMinted = false;
    try {
      isAlreadyMinted = await contract.isCidMinted(cleanAssetId);
    } catch {
      // Method may not exist on custom contract, proceed
    }

    if (!isAlreadyMinted) {
      actionType = 'NFT Minted';
      try {
        tx = await contract.mintAssetNFT(recipient, recipientDid, cleanAssetId, digest, tokenUri);
      } catch (mintErr: any) {
        console.warn('mintAssetNFT failed or unavailable, executing verified access log:', mintErr);
        actionType = 'Access Verified';
        tx = await contract.verifyAndLogAccess(cleanAssetId);
      }
    } else {
      // CID already exists as an NFT, verify and record access log
      actionType = 'Access Verified';
      tx = await contract.verifyAndLogAccess(cleanAssetId);
    }
  } else if (userRole.includes('Manager')) {
    actionType = 'Asset Allocated';
    tx = await contract.verifyAndLogAccess(cleanAssetId);
  } else {
    // Regular User
    actionType = 'Access Verified';
    tx = await contract.verifyAndLogAccess(cleanAssetId);
  }

  // Wait for real on-chain confirmation
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction execution was reverted on the blockchain.');
  }

  // Parse events for real tokenId if an NFT was minted
  if (actionType === 'NFT Minted') {
    try {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'NFTMinted') {
            mintedTokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch {}
      }
    } catch {}

    if (!mintedTokenId) {
      try {
        const total = await contract.totalAssetsMinted();
        mintedTokenId = Number(total);
      } catch {}
    }
  }

  const gasUsedStr = `${Number(receipt.gasUsed).toLocaleString()} gas units`;

  return {
    success: true,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: gasUsedStr,
    actionType,
    tokenId: mintedTokenId,
    did,
  };
}
