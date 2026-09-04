const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Load environment variables if present
function loadEnv() {
  const envPath = fs.existsSync(path.join(__dirname, '..', '.env'))
    ? path.join(__dirname, '..', '.env')
    : path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').replace(/^["']|["']$/g, '').trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

async function main() {
  loadEnv();

  console.log('====================================================');
  console.log('SentinelChain: Deploying SentinelAuditRegistry...');
  console.log('Network: Polygon Amoy Testnet (Chain ID 80002)');
  console.log('====================================================');

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-amoy.drpc.org';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey.length < 64) {
    console.error('❌ Error: PRIVATE_KEY not found or invalid in .env / .env.example');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(formattedKey, provider);

  console.log('Deployer account:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'POL');

  if (balance === 0n) {
    console.error('\n❌ Insufficient Balance: Deployer account has 0 POL.');
    console.error('Please get testnet POL from: https://faucet.polygon.technology/');
    console.error('Target address:', wallet.address);
    process.exit(1);
  }

  const artifactPath = path.join(__dirname, '..', 'contracts', 'SentinelAuditRegistry.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Contract artifact not found at:', artifactPath);
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log('\nBroadcasting deployment transaction to Polygon Amoy...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;

  console.log('\n✅ SentinelAuditRegistry successfully deployed!');
  console.log('Contract Address:', address);
  console.log('Deployment Tx:', txHash);
  console.log('Explorer URL:', `https://amoy.polygonscan.com/address/${address}`);
  console.log('====================================================');
  console.log('Add to your .env file:');
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Deployment failure:', err);
  process.exit(1);
});
