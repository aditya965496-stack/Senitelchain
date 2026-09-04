const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compileContract() {
  console.log('====================================================');
  console.log('SentinelChain: Compiling SentinelAuditRegistry.sol...');
  console.log('Solidity Compiler Version:', solc.version());
  console.log('====================================================');

  const contractPath = path.join(__dirname, '..', 'contracts', 'SentinelAuditRegistry.sol');
  if (!fs.existsSync(contractPath)) {
    console.error('[ERROR] Contract source file not found at:', contractPath);
    process.exit(1);
  }

  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'SentinelAuditRegistry.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        hasError = true;
        console.error('[ERROR] Compilation Error:', error.formattedMessage);
      } else {
        console.warn('[WARN]:', error.formattedMessage);
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  const compiled = output.contracts['SentinelAuditRegistry.sol']['SentinelAuditRegistry'];
  if (!compiled) {
    console.error('[ERROR]: SentinelAuditRegistry contract not found in compilation output.');
    process.exit(1);
  }

  const artifact = {
    contractName: 'SentinelAuditRegistry',
    abi: compiled.abi,
    bytecode: `0x${compiled.evm.bytecode.object}`,
    deployedBytecode: `0x${compiled.evm.bytecode.object}`,
    compiler: {
      version: solc.version(),
    },
    updatedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, '..', 'contracts', 'SentinelAuditRegistry.json');
  fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2), 'utf8');

  console.log('[SUCCESS] SentinelAuditRegistry compiled successfully.');
  console.log('ABI methods count:', compiled.abi.length);
  console.log('Bytecode size:', Math.round(compiled.evm.bytecode.object.length / 2), 'bytes');
  console.log('Artifact saved to:', outputPath);
  console.log('====================================================');
}

compileContract();
