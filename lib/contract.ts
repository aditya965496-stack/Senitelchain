import { ethers } from 'ethers';
import { UserRole } from './types';

export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_AMOY_CHAIN_ID_HEX = '0x13882';

export const DEFAULT_CONTRACT_ADDRESS = '0x71c94bc817d1ff8902898b677a016daf3460a9c1';

export const CONTRACT_ABI = [
  'function verifyAndLogAccess(string memory assetId) external returns (bool)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function isPaused() external view returns (bool)',
  'event AccessLogged(address indexed user, string assetId, uint256 timestamp)',
];

export interface TxExecutionResult {
  success: boolean;
  txHash: string;
  blockNumber?: number;
  gasUsed: string;
  isSimulated?: boolean;
  errorMessage?: string;
}

/**
 * Ensure browser wallet is connected to Polygon Amoy
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
 * Submit Access Verification Transaction to Polygon Amoy
 */
export async function executeContractAccessLog(
  contractAddress: string,
  assetId: string,
  userRole: UserRole
): Promise<TxExecutionResult> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask or Web3 Provider is not detected.');
  }

  const validAddress = normalizeAddress(contractAddress);

  await switchOrAddPolygonAmoy();

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  // Validate balance
  const balance = await provider.getBalance(signerAddress);
  if (balance.toString() === '0' || balance <= BigInt(0)) {
    throw new Error('INSUFFICIENT_FUNDS');
  }

  const contract = new ethers.Contract(validAddress, CONTRACT_ABI, signer);

  // Send transaction with dynamic gas estimation
  const tx = await contract.verifyAndLogAccess(assetId.trim());
  const receipt = await tx.wait();

  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction execution reverted by smart contract.');
  }

  const gasUsedStr = `${Number(receipt.gasUsed).toLocaleString()} gas units`;

  return {
    success: true,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: gasUsedStr,
    isSimulated: false,
  };
}

/**
 * Fast Simulated Execution (Demo Mode)
 */
export function simulateContractExecution(
  assetId: string,
  userRole: UserRole,
  walletAddress: string | null
): Promise<TxExecutionResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const simulatedTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      const simulatedGas = Math.floor(46000 + Math.random() * 9500);

      resolve({
        success: true,
        txHash: simulatedTxHash,
        blockNumber: 12489020 + Math.floor(Math.random() * 500),
        gasUsed: `${simulatedGas.toLocaleString()} gas units`,
        isSimulated: true,
      });
    }, 750);
  });
}
