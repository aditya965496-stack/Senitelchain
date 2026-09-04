# SentinelChain | Decentralized Identity (DID), NFT Asset Ownership & RBAC Platform

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Next.js 13](https://img.shields.io/badge/Framework-Next.js%2013-black.svg)](https://nextjs.org/)
[![Polygon Amoy](https://img.shields.io/badge/Network-Polygon%20Amoy%20(80002)-8247e5.svg)](https://amoy.polygonscan.com/)
[![Web Crypto API](https://img.shields.io/badge/Cryptography-AES--256--GCM-blue.svg)](#)
[![ERC-721](https://img.shields.io/badge/Standard-ERC--721%20NFT-purple.svg)](#)
[![W3C DID](https://img.shields.io/badge/Standard-W3C%20DID%20v1.0-orange.svg)](#)

SentinelChain is an enterprise decentralized blockchain platform integrating **Decentralized Identity (DID) Management**, **NFT-based Digital Asset Ownership**, **Smart Contract Role-Based Access Control (RBAC)**, and an **Immutable Audit Trail** on the **Polygon Amoy EVM network**.

---

## Comprehensive Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │              CLIENT (Next.js 13+ App Router)            │
                                    │  - W3C DID Engine (did:sentinel:80002:<address>)       │
                                    │  - Web Crypto API (AES-256-GCM Zero-Knowledge)         │
                                    │  - ECDSA Web3 Signature Authentication & RBAC           │
                                    │  - ERC-721 NFT Asset Minting & Allocation Controls     │
                                    │  - Real-Time Telemetry & Hardware Benchmarks           │
                                    └───────────────┬───────────────────────┬────────────────┘
                                                    │                       │
                                Encrypted Blob / REST                       │ On-Chain EVM Tx
                                                    ▼                       ▼
                          ┌───────────────────────────────────┐    ┌──────────────────────────────────┐
                          │  NEXT.JS SECURE BACKEND API       │    │  POLYGON AMOY (EVM)              │
                          │  - /api/did (W3C DID Resolution)  │    │  - SentinelAuditRegistry.sol     │
                          │  - /api/nft (Asset NFT Registry)  │    │  - ERC-721 NFT Digital Assets    │
                          │  - /api/ipfs/pin (Pinata Gateway) │    │  - RBAC: Admin, Manager,         │
                          │  - /api/audit (Persistent Trail)  │    │    Auditor, User                 │
                          │  - /api/health (DevOps Liveness)  │    │  - Immutable Event Logs:         │
                          └─────────────────┬─────────────────┘    │    IdentityRegistered, NFTMinted,│
                                            │                      │    AssetAllocated, AccessLogged  │
                                            ▼                      └──────────────────────────────────┘
                          ┌───────────────────────────────────┐
                          │   IPFS DECENTRALIZED STORAGE      │
                          │   - Content-Addressed CIDs        │
                          │   - Pinata Gateway Cluster        │
                          │   - ERC-721 OpenSea Metadata JSON │
                          └───────────────────────────────────┘
```

---

## Core Pillars & Features

### 1. Decentralized Identity (DID) Management
* **W3C DID Specification**: Each user is bound to a self-sovereign Decentralized Identifier: `did:sentinel:80002:<address>`.
* **Cryptographic Proofs**: Authenticated using ECDSA `personal_sign` challenges over `secp256k1`.
* **Verifiable Credentials**: Produces standardized DID Documents with verification methods and controller bindings.
* **On-Chain Identity Registry**: Smart contract maps DIDs to wallet addresses, roles, and lifecycle statuses.

### 2. NFT-Based Digital Asset Ownership (ERC-721)
* **Unique & Traceable Assets**: Digital assets are represented as Non-Fungible Tokens (`SENTINEL`), permanently recording provenance and ownership history.
* **Direct Allocation to DIDs**: Each minted NFT is directly bound to the owner's DID and wallet address.
* **Tamper-Proof Metadata**: Links IPFS content identifiers (CIDs) and cryptographic SHA-256 digests.
* **Deduplication Enforcement**: On-chain logic guarantees that an asset CID cannot be minted multiple times or duplicated.

### 3. Role-Based Access Control (RBAC)
Governed by smart contracts with 4 granular roles:
* **Admin (Issuer)**: Complete administrative control. Only administrators/managers are permitted to mint NFTs, allocate them to user identities, grant/revoke roles, and toggle the emergency circuit breaker.
* **Manager (Asset Manager)**: Asset lifecycle management. Can allocate NFT assets, assign access rights, and initiate transfers.
* **Auditor (Viewer - Read-Only)**: Zero-trust regulatory compliance. Read-only ledger inspection without write permissions.
* **User (Asset Owner)**: Identity holder. Holds allocated NFT assets, verifies ownership authenticity, and accesses authorized assets.

### 4. Immutable Audit Trail
Every system action is immutably recorded on the blockchain and queryable:
* `IdentityRegistered(address user, string did, bytes32 role, uint256 timestamp)`
* `NFTMinted(uint256 tokenId, string assetCid, address owner, string ownerDid, uint256 timestamp)`
* `AssetAllocated(uint256 tokenId, address prevOwner, address newOwner, string newOwnerDid, uint256 timestamp)`
* `AccessRightsAssigned(bytes32 role, address targetUser, address assignedBy, uint256 timestamp)`
* `AccessLogged(address user, string assetId, uint256 timestamp)`

---

## Quick Start & Deployment

### 1. Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Dockerized Production Deployment
```bash
# Build and launch multi-stage container
docker-compose up -d --build

# View container logs
docker-compose logs -f
```

---

### 3. Smart Contract Deployment (Polygon Amoy)
The upgraded Solidity contract is located at `contracts/SentinelAuditRegistry.sol`.

To deploy using **Remix IDE**:
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Load `contracts/SentinelAuditRegistry.sol`.
3. In **Solidity Compiler**, select compiler version `0.8.20` and compile.
4. In **Deploy & Run Transactions**, select **Injected Provider - MetaMask** (ensure network is Polygon Amoy `80002`).
5. Click **Deploy**.
6. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env` to your deployed address.

---

## REST API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | DevOps healthcheck, uptime, and framework subsystem status |
| `GET` | `/api/did` | Query and resolve W3C Decentralized Identifiers & DID Documents |
| `POST` | `/api/did` | Register identity with ECDSA cryptographic signature proof |
| `GET` | `/api/nft` | Query minted digital asset NFTs by owner, tokenId, or CID |
| `POST` | `/api/nft` | Record new minted NFT digital asset |
| `GET` | `/api/audit` | Query audit trail with search & role filters (supports `?format=csv`) |
| `POST` | `/api/audit` | Record verified immutable access or lifecycle event |
| `POST` | `/api/ipfs/pin` | Pin encrypted payload and structured ERC-721 metadata to IPFS |

---

## Cryptographic Specifications

* **Symmetric Cipher:** `AES-256-GCM` (Galois/Counter Mode with 128-bit authentication tag)
* **Initialization Vector (IV):** Cryptographically random 96-bit vector per file
* **Integrity Digest:** `SHA-256` multihash calculated pre- and post-sealing
* **Digital Signatures:** `ECDSA` (`secp256k1`) over EVM `personal_sign` and EIP-712
* **Decentralized Identifiers:** W3C DID Core 1.0 (`did:sentinel:80002:<address>`)
* **NFT Standard:** ERC-721 Non-Fungible Token standard
