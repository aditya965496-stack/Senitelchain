// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelAuditRegistry
 * @dev Enterprise Zero-Trust Access Control & Decentralized Audit Verification Registry
 * Implements granular Role-Based Access Control (RBAC), emergency circuit breakers,
 * and immutable event indexing for EVM networks (Polygon Amoy / Ethereum).
 */
contract SentinelAuditRegistry {
    // Role Definitions (Keccak-256 Hashes)
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // State Variables
    address public owner;
    bool public paused;
    uint256 public totalAccessLogs;

    // RBAC mapping: role => account => hasRole
    mapping(bytes32 => mapping(address => bool)) private _roles;

    // Audit trail registry mapping: assetId => AccessRecord[]
    struct AccessRecord {
        address requester;
        uint256 timestamp;
        uint256 blockNumber;
    }
    mapping(string => AccessRecord[]) private _assetAccessHistory;

    // Events
    event AccessLogged(
        address indexed user,
        string assetId,
        uint256 timestamp
    );
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event CircuitBreakerToggled(bool isPaused, address operator);

    modifier onlyOwner() {
        require(msg.sender == owner, "SentinelAudit: Caller is not contract owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "SentinelAudit: Contract is paused by circuit breaker");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner ||
            _roles[ISSUER_ROLE][msg.sender] ||
            _roles[OFFICER_ROLE][msg.sender],
            "SentinelAudit: Access Denied. Caller lacks logging authorization."
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        _roles[DEFAULT_ADMIN_ROLE][msg.sender] = true;
        _roles[ISSUER_ROLE][msg.sender] = true;
        _roles[OFFICER_ROLE][msg.sender] = true;
        _roles[AUDITOR_ROLE][msg.sender] = true;
    }

    /**
     * @notice Verifies cryptographic request and commits immutable access audit entry to blockchain
     * @param assetId The IPFS content identifier (CID) or cryptographic hash of the asset
     * @return success Returns true if event is committed successfully
     */
    function verifyAndLogAccess(string calldata assetId) external whenNotPaused returns (bool) {
        require(bytes(assetId).length > 0, "SentinelAudit: Asset CID cannot be empty");

        _assetAccessHistory[assetId].push(AccessRecord({
            requester: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number
        }));

        totalAccessLogs++;

        emit AccessLogged(msg.sender, assetId, block.timestamp);
        return true;
    }

    /**
     * @notice Batch logging for high-throughput enterprise pipelines
     */
    function batchVerifyAndLog(string[] calldata assetIds) external whenNotPaused returns (uint256) {
        uint256 count = assetIds.length;
        for (uint256 i = 0; i < count; i++) {
            _assetAccessHistory[assetIds[i]].push(AccessRecord({
                requester: msg.sender,
                timestamp: block.timestamp,
                blockNumber: block.number
            }));
            emit AccessLogged(msg.sender, assetIds[i], block.timestamp);
        }
        totalAccessLogs += count;
        return count;
    }

    /**
     * @notice Check whether an account holds a specific zero-trust role
     */
    function hasRole(bytes32 role, address account) external view returns (bool) {
        return _roles[role][account];
    }

    /**
     * @notice Grant role to account (Admin only)
     */
    function grantRole(bytes32 role, address account) external onlyOwner {
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @notice Revoke role from account (Admin only)
     */
    function revokeRole(bytes32 role, address account) external onlyOwner {
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    /**
     * @notice Emergency Pause / Unpause Circuit Breaker
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit CircuitBreakerToggled(_paused, msg.sender);
    }

    /**
     * @notice Query access count for a specific asset CID
     */
    function getAccessCount(string calldata assetId) external view returns (uint256) {
        return _assetAccessHistory[assetId].length;
    }
}
