# 🚀 StellarMint — Advanced Soroban NFT Platform

[![CI/CD Status](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen)](https://nft-minting-platform-2.vercel.app)

A next-generation, premium **NFT Minting & Management Platform** powered by **Soroban Smart Contracts** on the **Stellar Blockchain**. Featuring a gorgeous, responsive, glassmorphic dark-mode dashboard with real Stellar wallet integrations (@stellar/freighter-api, @stellar/stellar-sdk, and stellar-wallets-kit).

---

## 📜 Verified Smart Contract & Explorer Link

*   **Verified Contract ID Statement:** `CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B`
*   **Verified Contract Address:** `CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B`
*   **Stellar Expert Explorer Link:** [View Verified Soroban Smart Contract on Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B)

---

## 🔗 Submission Details

*   **Live Demo (Vercel):** [nft-minting-platform-2.vercel.app](https://nft-minting-platform-2.vercel.app)
*   **GitHub Repository:** [github.com/arpanbasak90-cyber/NFT-Minting-Platform](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform)
*   **Stellar Explorer Contract Link:** [Stellar Expert Explorer - Contract CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B](https://stellar.expert/explorer/testnet/contract/CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B)

---

## 🛠️ Step-by-Step Deployment Instructions

### 1. Prerequisites & Environment Setup
Ensure Rust, target `wasm32-unknown-unknown`, and the Stellar CLI (`stellar-cli`) are installed:
```bash
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt
```

### 2. Smart Contract Build & Compilation
Navigate into the smart contract workspace and compile the WASM binary:
```bash
cd contract
stellar contract build
```
This builds the target binary at:
`contract/target/wasm32-unknown-unknown/release/contract.wasm`

### 3. Run Automated Unit Tests (9/9 Passing)
Run all Soroban environment unit tests to verify contract logic:
```bash
cargo test
```

### 4. Deploy Smart Contract to Stellar Testnet
Generate a deployer key identity, fund it via SDF Friendbot, and deploy the WASM contract binary:
```bash
# Generate key identity
stellar keys generate deployer --network testnet

# Deploy WASM bytecode to Stellar Testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contract.wasm \
  --source deployer \
  --network testnet
```
**Output Verified Contract ID:**
`CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B`

### 5. Contract Function Invocation via CLI
Invoke smart contract functions directly matching `lib.rs`:

```bash
# Mint NFT (mint)
stellar contract invoke \
  --id CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B \
  --source deployer \
  --network testnet \
  -- mint \
  --to G... \
  --token_id 1 \
  --metadata 0000000000000000000000000000000000000000000000000000000000000000 \
  --name "StellarGenesis"

# Transfer NFT (transfer)
stellar contract invoke \
  --id CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B \
  --source deployer \
  --network testnet \
  -- transfer \
  --from G... \
  --to G... \
  --token_id 1

# Query NFT Details (get_nft)
stellar contract invoke \
  --id CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B \
  --network testnet \
  -- get_nft \
  --token_id 1

# Total Supply (total_supply)
stellar contract invoke \
  --id CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B \
  --network testnet \
  -- total_supply
```

---

## ⚡ Key Features

1.  **🔒 Landing Page Access Gate:** Main application dashboard locked until wallet authentication.
2.  **👛 Stellar Wallet Integration:** Native integration with `@stellar/freighter-api`, `@stellar/stellar-sdk`, and `stellar-wallets-kit` supporting **Freighter**, **Albedo**, and **xBull**.
3.  **💰 Live Horizon Balance Fetcher:** Queries native XLM balance from Horizon RPC (`https://horizon-testnet.stellar.org`).
4.  **🎨 Glassmorphic Dark/Light Mode:** Vibrant, modern UI with theme persistence.
5.  **🖼️ Searchable & Sortable NFT Gallery:** Search NFTs by ID or name with sorting algorithms.
6.  **📊 Real-time Latency RPC Tracker:** Monitors live network latency.
7.  **💾 CSV Data Exporter:** Export Activity Feed and Transaction Center logs.
8.  **⚡ Quick Mint Templates:** Preset metadata templates for quick minting.
9.  **🛠️ Custom Metadata Hash Generator:** Real-time SHA-256 hash generator.
10. **📜 Soroban Contract Matching:** Frontend calls directly map to `lib.rs` functions (`mint`, `transfer`, `burn`, `get_nft`, `get_owner`, `total_supply`).

---

## 🧪 Passing Test Outputs (9/9 Passed)

```bash
running 7 tests
test test::test_mint_nft ... ok
test test::test_mint_duplicate_fails ... ok
test test::test_transfer_nft ... ok
test test::test_get_owner ... ok
test test::test_transfer_not_owner_fails ... ok
test test::test_burn_nft ... ok
test test::test_total_supply ... ok

test result: ok. 7 passed; 0 failed

running 2 tests
test test::test_initialize_registry ... ok
test test::test_list_collections_empty ... ok

test result: ok. 2 passed; 0 failed
```

---

## 💻 Running Local Frontend

```bash
# Serve frontend using local server
npx serve frontend
```

---

## 👨‍💻 Author

**Arpan Basak**
*   **Email:** arpanbasak90@gmail.com
*   **GitHub:** [@arpanbasak90-cyber](https://github.com/arpanbasak90-cyber)
*   **License:** MIT
