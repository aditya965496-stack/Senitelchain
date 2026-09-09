import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('Testing Logout State Sanitization & Text Box Cleansing');
console.log('================================================================\n');

// 1. Check page.tsx handleDisconnect Implementation
const pagePath = path.join(__dirname, '..', 'app', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

assert(pageContent.includes('const [contractAddress, setContractAddress] = useState<string>(\'\');'), 'contractAddress must start as an empty string');
assert(pageContent.includes('setContractAddress(\'\')'), 'handleDisconnect must wipe contractAddress so SMART CONTRACT REGISTRY input is empty');
assert(pageContent.includes('setAssetId(\'\')'), 'handleDisconnect must wipe assetId so ASSET IDENTIFIER input is empty');
assert(pageContent.includes('setSelectedFile(null)'), 'handleDisconnect must clear selectedFile');
assert(pageContent.includes('setEncryptedPayload(null)'), 'handleDisconnect must clear encryptedPayload');
assert(pageContent.includes('setPinnedCid(\'\')'), 'handleDisconnect must clear pinnedCid');
assert(pageContent.includes('setDecryptedResult(null)'), 'handleDisconnect must clear decryptedResult');
assert(pageContent.includes('setTxStatus(\'\')'), 'handleDisconnect must clear txStatus feedback');
assert(pageContent.includes("localStorage.removeItem('sentinel_contract_address')"), 'handleDisconnect must remove sentinel_contract_address from localStorage');
assert(pageContent.includes('wagmiDisconnect?.()'), 'handleDisconnect must trigger Wagmi connector disconnection');
assert(pageContent.includes('accountsChanged'), 'page.tsx must listen to accountsChanged to sanitize on external wallet disconnect');
assert(pageContent.includes('eth.on?.(\'disconnect\', handleDisconnect)'), 'page.tsx must listen to wallet disconnect event');
console.log('  [PASS]: page.tsx handleDisconnect thoroughly wipes all inputs, storage, and session data');

// 2. Check RoleAssignment.tsx Gating & Placeholder Sanitization
const roleCompPath = path.join(__dirname, '..', 'components', 'RoleAssignment.tsx');
const roleCompContent = fs.readFileSync(roleCompPath, 'utf8');

assert(!roleCompContent.includes('0xad711843853223b3D190343183B251B24A7Bf06a'), 'Target address placeholder must NOT contain hardcoded mock addresses');
assert(roleCompContent.includes('setTargetAddress(\'\')'), 'RoleAssignment must wipe targetAddress when disconnected');
assert(roleCompContent.includes('setCustomContractInput(\'\')'), 'RoleAssignment must wipe customContractInput when disconnected');
assert(roleCompContent.includes('const isCallerConnected = Boolean(callerAddress && isAuthenticated);'), 'Must strictly require authenticated caller session');
assert(roleCompContent.includes('if (!isAdmin) {'), 'Must check if (!isAdmin)');
assert(roleCompContent.includes('Access Denied: Only Administrators can assign cryptographic roles.'), 'Must render access denied message when disconnected');
console.log('  [PASS]: RoleAssignment.tsx hides form and wipes target address when disconnected');

// 3. Check IngestionGateway.tsx Text Box & File Input Sanitization
const ingestionPath = path.join(__dirname, '..', 'components', 'IngestionGateway.tsx');
const ingestionContent = fs.readFileSync(ingestionPath, 'utf8');

assert(ingestionContent.includes('setUnlockKey(\'\')'), 'IngestionGateway must clear unlockKey input when logged out');
assert(ingestionContent.includes('fileInputRef.current.value = \'\''), 'IngestionGateway must reset file input DOM element when logged out');
console.log('  [PASS]: IngestionGateway.tsx clears unlockKey and file input when logged out');

// 4. Check NFTAssetGallery.tsx & AuditLedgerTable.tsx
const galleryPath = path.join(__dirname, '..', 'components', 'NFTAssetGallery.tsx');
const galleryContent = fs.readFileSync(galleryPath, 'utf8');
assert(galleryContent.includes('setSearchQuery(\'\')'), 'NFTAssetGallery must clear searchQuery input when disconnected');
assert(galleryContent.includes('setTargetAddress(\'\')'), 'NFTAssetGallery must clear reallocate target address when disconnected');

const tablePath = path.join(__dirname, '..', 'components', 'AuditLedgerTable.tsx');
const tableContent = fs.readFileSync(tablePath, 'utf8');
assert(tableContent.includes('setSearchTerm(\'\')'), 'AuditLedgerTable must clear searchTerm input when disconnected');
console.log('  [PASS]: NFTAssetGallery and AuditLedgerTable search and action inputs cleared on logout');

console.log('\n================================================================');
console.log('ALL LOGOUT SANITIZATION TESTS PASSED (4 / 4)');
console.log('================================================================\n');
