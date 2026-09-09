// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SentinelAuditRegistry
 * @notice Enterprise Decentralized Identity (DID), NFT-Based Asset Ownership & Access Control Platform
 * @dev Governs self-sovereign digital identities (DIDs), unique ERC-721 digital asset NFTs directly
 * allocated to user identities, granular Role-Based Access Control (Admin, Manager, Auditor, User),
 * and an immutable on-chain audit trail on EVM networks (Polygon Amoy / Ethereum).
 */
contract SentinelAuditRegistry {
    // ==========================================
    // ERC-721 & ERC-165 Metadata
    // ==========================================
    string public constant name = "Sentinel Asset NFT";
    string public constant symbol = "SENTINEL";

    // ==========================================
    // Role Definitions (Keccak-256 Hashes)
    // ==========================================
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    // Backward-compatibility aliases
    bytes32 public constant ISSUER_ROLE = ADMIN_ROLE;
    bytes32 public constant OFFICER_ROLE = MANAGER_ROLE;

    // ==========================================
    // Data Structures
    // ==========================================

    /// @dev Decentralized Identifier (DID) Identity Record
    struct IdentityRecord {
        string did;             // W3C Decentralized Identifier (e.g. did:sentinel:80002:0x...)
        address wallet;         // Associated EVM wallet address
        bytes32 role;           // Primary RBAC role
        uint256 registeredAt;   // Registration block timestamp
        bool isActive;          // Status flag
    }

    /// @dev Non-Fungible Digital Asset Record
    struct AssetNFTRecord {
        uint256 tokenId;        // Unique NFT Token ID
        string assetCid;        // IPFS Content Identifier (encrypted payload hash)
        string sha256Digest;    // Pre-calculated SHA-256 data integrity checksum
        address owner;          // Current owner wallet address
        string ownerDid;        // Direct binding to owner's Decentralized Identifier
        address creator;        // Admin/Manager account that minted the asset
        string tokenUri;        // Token metadata URI (IPFS / JSON)
        uint256 mintedAt;       // Minting block timestamp
        bool isAllocated;       // Allocation state flag
    }

    /// @dev Access Audit Record
    struct AccessRecord {
        address requester;      // Account requesting or verifying access
        string action;          // Type of action: "VERIFY_ACCESS", "MINT_NFT", "ALLOCATE_ASSET", etc.
        uint256 timestamp;      // Block timestamp
        uint256 blockNumber;    // Block height
    }

    // ==========================================
    // State Variables
    // ==========================================
    address public owner;
    bool public paused;
    uint256 private _nextTokenId;
    uint256 public totalAccessLogs;
    uint256 public totalIdentities;
    uint256 public totalAssetsMinted;

    // RBAC mapping: role => account => hasRole
    mapping(bytes32 => mapping(address => bool)) private _roles;

    // Identity Registry: wallet address => IdentityRecord
    mapping(address => IdentityRecord) private _identities;
    mapping(string => address) private _didToAddress;

    // NFT Token Registry
    mapping(uint256 => AssetNFTRecord) private _assetNFTs;
    mapping(uint256 => address) private _tokenOwners;
    mapping(address => uint256) private _tokenBalances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(string => bool) private _cidMinted; // Prevents duplicate asset minting

    // Token Ownership index per user
    mapping(address => uint256[]) private _userOwnedTokens;
    mapping(uint256 => uint256) private _userOwnedTokensIndex;

    // Audit Trail: assetId/CID => AccessRecord[]
    mapping(string => AccessRecord[]) private _assetAccessHistory;

    // ==========================================
    // Events
    // ==========================================
    // Identity Events
    event IdentityRegistered(
        address indexed user,
        string did,
        bytes32 indexed role,
        uint256 timestamp
    );
    event IdentityStatusChanged(
        address indexed user,
        string did,
        bool isActive,
        uint256 timestamp
    );

    // NFT Asset Events
    event NFTMinted(
        uint256 indexed tokenId,
        string assetCid,
        address indexed owner,
        string ownerDid,
        uint256 timestamp
    );
    event AssetAllocated(
        uint256 indexed tokenId,
        address indexed previousOwner,
        address indexed newOwner,
        string newOwnerDid,
        uint256 timestamp
    );

    // Access Control & RBAC Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event AccessRightsAssigned(
        bytes32 indexed role,
        address indexed targetUser,
        address indexed assignedBy,
        uint256 timestamp
    );

    // Audit Events
    event AccessLogged(
        address indexed user,
        string assetId,
        uint256 timestamp
    );
    event DetailedAccessLogged(
        address indexed user,
        string assetId,
        string action,
        uint256 timestamp,
        uint256 blockNumber
    );

    // ERC-721 Standard Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // System Events
    event CircuitBreakerToggled(bool isPaused, address operator);

    // ==========================================
    // Modifiers
    // ==========================================
    modifier onlyOwner() {
        require(msg.sender == owner, "SentinelAudit: Caller is not contract owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "SentinelAudit: Contract is paused by circuit breaker");
        _;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner || _roles[DEFAULT_ADMIN_ROLE][msg.sender] || _roles[ADMIN_ROLE][msg.sender],
            "SentinelAudit: Access Denied. Admin privilege required."
        );
        _;
    }

    modifier onlyAdminOrManager() {
        require(
            msg.sender == owner ||
            _roles[DEFAULT_ADMIN_ROLE][msg.sender] ||
            _roles[ADMIN_ROLE][msg.sender] ||
            _roles[MANAGER_ROLE][msg.sender],
            "SentinelAudit: Access Denied. Admin or Manager role required."
        );
        _;
    }

    modifier notAuditorWrite() {
        require(!_roles[AUDITOR_ROLE][msg.sender] || msg.sender == owner, "SentinelAudit: Auditor has read-only access");
        _;
    }

    // ==========================================
    // Constructor
    // ==========================================
    constructor() {
        owner = msg.sender;
        _nextTokenId = 1001; // Start token IDs at 1001

        // Assign foundational roles to contract deployer
        _roles[DEFAULT_ADMIN_ROLE][msg.sender] = true;
        _roles[ADMIN_ROLE][msg.sender] = true;
        _roles[MANAGER_ROLE][msg.sender] = true;
        _roles[USER_ROLE][msg.sender] = true;

        // Register initial identity for deployer
        string memory deployerDid = string(abi.encodePacked("did:sentinel:80002:", _toAsciiString(msg.sender)));
        _identities[msg.sender] = IdentityRecord({
            did: deployerDid,
            wallet: msg.sender,
            role: ADMIN_ROLE,
            registeredAt: block.timestamp,
            isActive: true
        });
        _didToAddress[deployerDid] = msg.sender;
        totalIdentities = 1;

        emit IdentityRegistered(msg.sender, deployerDid, ADMIN_ROLE, block.timestamp);
    }

    // ==========================================
    // Decentralized Identity (DID) Management
    // ==========================================

    /**
     * @notice Register or update a decentralized identity (DID) for a user
     * @param user The EVM wallet address
     * @param did The W3C Decentralized Identifier string
     * @param role The RBAC role assigned to the identity
     */
    function registerIdentity(
        address user,
        string calldata did,
        bytes32 role
    ) external onlyAdminOrManager whenNotPaused returns (bool) {
        require(user != address(0), "SentinelAudit: Invalid user address");
        require(bytes(did).length > 0, "SentinelAudit: DID string cannot be empty");

        bool isNew = (_identities[user].wallet == address(0));

        _identities[user] = IdentityRecord({
            did: did,
            wallet: user,
            role: role,
            registeredAt: block.timestamp,
            isActive: true
        });
        _didToAddress[did] = user;
        _roles[role][user] = true;

        if (isNew) {
            totalIdentities++;
        }

        emit IdentityRegistered(user, did, role, block.timestamp);
        emit RoleGranted(role, user, msg.sender);
        emit AccessRightsAssigned(role, user, msg.sender, block.timestamp);

        return true;
    }

    /**
     * @notice Self-register own identity with basic USER_ROLE
     */
    function selfRegisterIdentity(string calldata did) external whenNotPaused returns (bool) {
        require(bytes(did).length > 0, "SentinelAudit: DID string cannot be empty");
        require(_identities[msg.sender].wallet == address(0), "SentinelAudit: Identity already registered");

        _identities[msg.sender] = IdentityRecord({
            did: did,
            wallet: msg.sender,
            role: USER_ROLE,
            registeredAt: block.timestamp,
            isActive: true
        });
        _didToAddress[did] = msg.sender;
        _roles[USER_ROLE][msg.sender] = true;
        totalIdentities++;

        emit IdentityRegistered(msg.sender, did, USER_ROLE, block.timestamp);
        return true;
    }

    /**
     * @notice Query identity record by wallet address
     */
    function getIdentity(address user) external view returns (IdentityRecord memory) {
        return _identities[user];
    }

    /**
     * @notice Resolve wallet address from Decentralized Identifier (DID)
     */
    function resolveDID(string calldata did) external view returns (address) {
        return _didToAddress[did];
    }

    /**
     * @notice Check if identity is currently active
     */
    function isIdentityActive(address user) external view returns (bool) {
        return _identities[user].isActive;
    }

    // ==========================================
    // NFT-Based Digital Asset Ownership (ERC-721)
    // ==========================================

    /**
     * @notice Mint a unique Digital Asset NFT and directly allocate it to a user identity
     * @dev Only authorized administrators/managers can mint NFTs to ensure controlled asset creation
     * @param to Recipient wallet address
     * @param did Recipient's Decentralized Identifier
     * @param assetCid Encrypted asset IPFS CID
     * @param sha256Digest Cryptographic integrity checksum
     * @param tokenUri Metadata URI pointing to ERC-721 metadata JSON
     * @return tokenId The unique minted NFT token ID
     */
    function mintAssetNFT(
        address to,
        string calldata did,
        string calldata assetCid,
        string calldata sha256Digest,
        string calldata tokenUri
    ) external onlyAdminOrManager whenNotPaused returns (uint256) {
        require(to != address(0), "SentinelAudit: Cannot mint to zero address");
        require(bytes(assetCid).length > 0, "SentinelAudit: Asset CID cannot be empty");
        require(!_cidMinted[assetCid], "SentinelAudit: Asset with this CID already minted");

        uint256 tokenId = _nextTokenId++;
        _cidMinted[assetCid] = true;

        _assetNFTs[tokenId] = AssetNFTRecord({
            tokenId: tokenId,
            assetCid: assetCid,
            sha256Digest: sha256Digest,
            owner: to,
            ownerDid: did,
            creator: msg.sender,
            tokenUri: tokenUri,
            mintedAt: block.timestamp,
            isAllocated: true
        });

        _tokenOwners[tokenId] = to;
        _tokenBalances[to] += 1;

        // Add to user's owned token array
        _userOwnedTokens[to].push(tokenId);
        _userOwnedTokensIndex[tokenId] = _userOwnedTokens[to].length - 1;

        totalAssetsMinted++;

        // Record audit entry
        _logAccessInternal(assetCid, msg.sender, "MINT_NFT");

        emit Transfer(address(0), to, tokenId);
        emit NFTMinted(tokenId, assetCid, to, did, block.timestamp);
        emit AssetAllocated(tokenId, address(0), to, did, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Reallocate/Transfer NFT asset to a new user identity (governed by Admin/Manager)
     */
    function allocateAssetNFT(
        uint256 tokenId,
        address newOwner,
        string calldata newOwnerDid
    ) external onlyAdminOrManager whenNotPaused returns (bool) {
        require(newOwner != address(0), "SentinelAudit: Invalid new owner address");
        address previousOwner = _tokenOwners[tokenId];
        require(previousOwner != address(0), "SentinelAudit: Token does not exist");

        // Update token ownership
        _tokenOwners[tokenId] = newOwner;
        _tokenBalances[previousOwner] -= 1;
        _tokenBalances[newOwner] += 1;

        // Remove from previous owner index
        _removeTokenFromOwnerEnumeration(previousOwner, tokenId);

        // Add to new owner index
        _userOwnedTokens[newOwner].push(tokenId);
        _userOwnedTokensIndex[tokenId] = _userOwnedTokens[newOwner].length - 1;

        // Update asset record
        _assetNFTs[tokenId].owner = newOwner;
        _assetNFTs[tokenId].ownerDid = newOwnerDid;

        // Log audit
        _logAccessInternal(_assetNFTs[tokenId].assetCid, msg.sender, "ALLOCATE_ASSET");

        emit Transfer(previousOwner, newOwner, tokenId);
        emit AssetAllocated(tokenId, previousOwner, newOwner, newOwnerDid, block.timestamp);

        return true;
    }

    /**
     * @notice Query details of a specific Asset NFT
     */
    function getAssetNFT(uint256 tokenId) external view returns (AssetNFTRecord memory) {
        require(_tokenOwners[tokenId] != address(0), "SentinelAudit: Token does not exist");
        return _assetNFTs[tokenId];
    }

    /**
     * @notice Get all token IDs owned by a user
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return _userOwnedTokens[user];
    }

    /**
     * @notice Check if a specific asset CID has already been minted
     */
    function isCidMinted(string calldata assetCid) external view returns (bool) {
        return _cidMinted[assetCid];
    }

    // ==========================================
    // ERC-721 Standard View Methods
    // ==========================================
    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "ERC721: address zero is not a valid owner");
        return _tokenBalances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _tokenOwners[tokenId];
        require(tokenOwner != address(0), "ERC721: invalid token ID");
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_tokenOwners[tokenId] != address(0), "ERC721: URI query for nonexistent token");
        return _assetNFTs[tokenId].tokenUri;
    }

    function approve(address to, uint256 tokenId) external whenNotPaused {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "ERC721: approval to current owner");
        require(
            msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_tokenOwners[tokenId] != address(0), "ERC721: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public whenNotPaused {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        // Clear approvals
        delete _tokenApprovals[tokenId];

        _tokenBalances[from] -= 1;
        _tokenBalances[to] += 1;
        _tokenOwners[tokenId] = to;

        _removeTokenFromOwnerEnumeration(from, tokenId);
        _userOwnedTokens[to].push(tokenId);
        _userOwnedTokensIndex[tokenId] = _userOwnedTokens[to].length - 1;

        _assetNFTs[tokenId].owner = to;
        _assetNFTs[tokenId].ownerDid = _identities[to].did;

        _logAccessInternal(_assetNFTs[tokenId].assetCid, msg.sender, "TRANSFER_NFT");

        emit Transfer(from, to, tokenId);
        emit AssetAllocated(tokenId, from, to, _identities[to].did, block.timestamp);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        transferFrom(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f;   // ERC-721Metadata
    }

    // ==========================================
    // Role-Based Access Control (RBAC)
    // ==========================================

    function hasRole(bytes32 role, address account) external view returns (bool) {
        return _roles[role][account];
    }

    function grantRole(bytes32 role, address account) external onlyAdmin {
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    function assignRole(bytes32 role, address account) external onlyAdmin {
        _roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }

    function revokeRole(bytes32 role, address account) external onlyAdmin {
        _roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }

    // ==========================================
    // Immutable Audit Trail & Access Verification
    // ==========================================

    /**
     * @notice Verifies access and commits immutable audit log to blockchain
     * @param assetId The IPFS content identifier (CID) or cryptographic hash
     */
    function verifyAndLogAccess(string calldata assetId) external whenNotPaused notAuditorWrite returns (bool) {
        require(bytes(assetId).length > 0, "SentinelAudit: Asset CID cannot be empty");
        _logAccessInternal(assetId, msg.sender, "VERIFY_ACCESS");
        return true;
    }

    /**
     * @notice Batch logging for high-throughput enterprise pipelines
     */
    function batchVerifyAndLog(string[] calldata assetIds) external whenNotPaused notAuditorWrite returns (uint256) {
        uint256 count = assetIds.length;
        for (uint256 i = 0; i < count; i++) {
            _logAccessInternal(assetIds[i], msg.sender, "BATCH_VERIFY");
        }
        return count;
    }

    /**
     * @notice Query total access count for a specific asset CID
     */
    function getAccessCount(string calldata assetId) external view returns (uint256) {
        return _assetAccessHistory[assetId].length;
    }

    /**
     * @notice Query access history for a specific asset CID
     */
    function getAssetAccessHistory(string calldata assetId) external view returns (AccessRecord[] memory) {
        return _assetAccessHistory[assetId];
    }

    /**
     * @notice Emergency Pause / Unpause Circuit Breaker
     */
    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
        emit CircuitBreakerToggled(_paused, msg.sender);
    }

    // ==========================================
    // Internal Helper Functions
    // ==========================================
    function _logAccessInternal(string memory assetId, address requester, string memory action) internal {
        _assetAccessHistory[assetId].push(AccessRecord({
            requester: requester,
            action: action,
            timestamp: block.timestamp,
            blockNumber: block.number
        }));

        totalAccessLogs++;

        emit AccessLogged(requester, assetId, block.timestamp);
        emit DetailedAccessLogged(requester, assetId, action, block.timestamp, block.number);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) internal {
        uint256 lastTokenIndex = _userOwnedTokens[from].length - 1;
        uint256 tokenIndex = _userOwnedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _userOwnedTokens[from][lastTokenIndex];
            _userOwnedTokens[from][tokenIndex] = lastTokenId;
            _userOwnedTokensIndex[lastTokenId] = tokenIndex;
        }

        _userOwnedTokens[from].pop();
        delete _userOwnedTokensIndex[tokenId];
    }

    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = "0";
        s[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 + 2 * i] = _char(hi);
            s[3 + 2 * i] = _char(lo);
        }
        return string(s);
    }

    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
