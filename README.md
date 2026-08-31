# 🛡️ SentinelChain | Enterprise Zero-Trust Access Control & Audit Gateway

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Next.js 13](https://img.shields.io/badge/Framework-Next.js%2013-black.svg)](https://nextjs.org/)
[![Polygon Amoy](https://img.shields.io/badge/Network-Polygon%20Amoy%20(80002)-8247e5.svg)](https://amoy.polygonscan.com/)
[![Web Crypto API](https://img.shields.io/badge/Cryptography-AES--256--GCM-blue.svg)](#)

SentinelChain is a production-grade, enterprise Zero-Trust Access Control & Decentralized Audit Verification platform. It provides hardware-accelerated client-side symmetric payload sealing (`AES-256-GCM`), decentralized IPFS multihash pinning, and immutable on-chain access verification on the **Polygon Amoy EVM network**.

---

## 🏛️ System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │              CLIENT (Next.js 13+ App Router)            │
                                    │  - Web Crypto API (AES-256-GCM Zero-Knowledge)         │
                                    │  - ECDSA Web3 Signature Authentication & RBAC           │
                                    │  - Key Management & Real-time Telemetry                │
                                    └───────────────┬───────────────────────┬────────────────┘
                                                    │                       │
                                Encrypted Blob (REST)                       │ On-Chain EVM Tx
                                                    ▼                       ▼
                          ┌───────────────────────────────────┐    ┌──────────────────────────────────┐
                          │  NEXT.JS SECURE BACKEND API       │    │  POLYGON AMOY (EVM)              │
                          │  - /api/ipfs/pin (Pinata Gateway) │    │  - SentinelAuditRegistry.sol     │
                          │  - /api/audit (Persistent Trail)  │    │  - OpenZeppelin RBAC Roles       │
                          │  - /api/health (DevOps Liveness)  │    │  - Immutable AccessLogged Events │
                          └─────────────────┬─────────────────┘    └──────────────────────────────────┘
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │   IPFS DECENTRALIZED STORAGE      │
                          │   - Content-Addressed CIDs        │
                          │   - Pinata Gateway Cluster        │
                          └───────────────────────────────────┘
```

---

## 🚀 Quick Start & Deployment

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
The Solidity contract is located at `contracts/SentinelAuditRegistry.sol`.

To deploy using **Remix IDE**:
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Load `contracts/SentinelAuditRegistry.sol`.
3. In **Solidity Compiler**, choose version `0.8.20` and compile.
4. In **Deploy & Run Transactions**, select **Injected Provider - MetaMask** (ensure network is Polygon Amoy `80002`).
5. Click **Deploy**.

---

## 📡 REST API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | DevOps healthcheck, uptime, and memory metrics probe |
| `GET` | `/api/audit` | Query audit trail with search & role filters (supports `?format=csv`) |
| `POST` | `/api/audit` | Record new verified immutable access log |
| `POST` | `/api/ipfs/pin` | Secure backend proxy for IPFS Pinata cluster pinning |

---

## 🔐 Cryptographic Specifications

* **Symmetric Cipher:** `AES-256-GCM` (Galois/Counter Mode with 128-bit authentication tag)
* **Initialization Vector (IV):** Cryptographically random 96-bit vector per file
* **Integrity Digest:** `SHA-256` multihash calculated pre- and post-sealing
* **Digital Signatures:** `ECDSA` (`secp256k1`) over EVM `personal_sign`

---

## 🛡️ Security Headers & Compliance

The application enforces production HTTP security headers:
* `Strict-Transport-Security` (HSTS)
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: SAMEORIGIN`
* `Referrer-Policy: origin-when-cross-origin`
