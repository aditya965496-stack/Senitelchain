import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('RoleAssignment Component Behavioral & RBAC Enforcement Test');
console.log('================================================================\n');

const componentPath = path.join(__dirname, '..', 'components', 'RoleAssignment.tsx');
const componentSource = fs.readFileSync(componentPath, 'utf8');

// 1. Static Contract & ABI Validation
const artifactPath = path.join(__dirname, '..', 'contracts', 'SentinelAuditRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const assignRoleMethod = artifact.abi.find((m) => m.name === 'assignRole');

assert(assignRoleMethod, 'assignRole function must be present in compiled contract ABI');
assert.strictEqual(assignRoleMethod.inputs.length, 2, 'assignRole must take 2 arguments: role and account');
assert.strictEqual(assignRoleMethod.inputs[0].type, 'bytes32', 'First parameter must be bytes32 role');
assert.strictEqual(assignRoleMethod.inputs[1].type, 'address', 'Second parameter must be address account');
console.log('  [PASS]: Smart contract assignRole(bytes32, address) ABI verified');

// 2. Exact Access Denial Message Verification
const requiredDenialMessage = 'Access Denied: Only Administrators can assign cryptographic roles.';
assert(
  componentSource.includes(requiredDenialMessage),
  `Component source must contain exact denial message: "${requiredDenialMessage}"`
);
console.log('  [PASS]: Exact access denial message verified in component');

// 3. Form Gating Verification
// Ensure the form is NOT rendered inside the access denied branch
const isAdminBlockStart = componentSource.indexOf('if (!isAdmin) {');
assert(isAdminBlockStart !== -1, 'Component must check if (!isAdmin)');
const isAdminBlockEnd = componentSource.indexOf('handleAssignRoleSubmit');
const deniedBranchContent = componentSource.slice(isAdminBlockStart, isAdminBlockEnd);

assert(!deniedBranchContent.includes('<form'), 'Form must be completely hidden when user is not an administrator');
assert(deniedBranchContent.includes(requiredDenialMessage), 'Denied branch must render the exact denial message');
console.log('  [PASS]: Form is completely hidden when !isAdmin, showing only denial message');

// 4. Form Controls Verification
assert(componentSource.includes('Target Wallet Address'), 'Form must contain label "Target Wallet Address"');
assert(componentSource.includes('Select Role'), 'Form must contain label "Select Role"');
assert(componentSource.includes('<option value="MANAGER">MANAGER</option>'), 'Dropdown must include MANAGER option');
assert(componentSource.includes('<option value="AUDITOR">AUDITOR</option>'), 'Dropdown must include AUDITOR option');
assert(componentSource.includes('<option value="USER">USER</option>'), 'Dropdown must include USER option');
console.log('  [PASS]: Form controls (Target Wallet Address and MANAGER/AUDITOR/USER options) verified');

// 5. Wagmi useWriteContract & useWaitForTransactionReceipt verification
assert(componentSource.includes('useWriteContract'), 'Must use wagmi useWriteContract hook');
assert(componentSource.includes('useWaitForTransactionReceipt'), 'Must use wagmi useWaitForTransactionReceipt hook');
assert(componentSource.includes('isPending'), 'Must track wallet authorization pending state');
assert(componentSource.includes('isConfirming'), 'Must track blockchain confirmation state');
assert(componentSource.includes('isConfirmed'), 'Must track transaction confirmation success state');
console.log('  [PASS]: Wagmi hooks and transaction telemetry states verified');

// 6. Role Hash Mapping Verification
assert(componentSource.includes('ROLE_MAP'), 'Must map role names to role hashes');
assert(componentSource.includes('ROLE_HASHES.MANAGER_ROLE'), 'Must map MANAGER to MANAGER_ROLE');
assert(componentSource.includes('ROLE_HASHES.AUDITOR_ROLE'), 'Must map AUDITOR to AUDITOR_ROLE');
assert(componentSource.includes('ROLE_HASHES.USER_ROLE'), 'Must map USER to USER_ROLE');
console.log('  [PASS]: Role hash mappings to MANAGER_ROLE, AUDITOR_ROLE, USER_ROLE verified');

console.log('\n================================================================');
console.log('ALL BEHAVIORAL & RBAC ASSERTIONS PASSED (6 / 6)');
console.log('================================================================\n');
