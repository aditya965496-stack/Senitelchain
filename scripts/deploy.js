const hre = require('hardhat');

async function main() {
  console.log('Deploying SentinelAuditRegistry to network:', hre.network.name);

  const SentinelAuditRegistry = await hre.ethers.getContractFactory('SentinelAuditRegistry');
  const registry = await SentinelAuditRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log('✅ SentinelAuditRegistry deployed successfully to:', address);
  console.log('Save this address to your .env NEXT_PUBLIC_CONTRACT_ADDRESS=', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
