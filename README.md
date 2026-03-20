# 🚀 NFT Minting Platform (Soroban - Stellar)

![Stellar Banner](https://developers.stellar.org/img/stellar-logo.png)

## 📌 Project Description

This project is a **basic NFT (Non-Fungible Token) minting platform** built using **Soroban smart contracts** on the **Stellar blockchain**.

It enables users to create, own, transfer, and query unique digital assets in a decentralized and efficient way. This project serves as a foundational implementation for building NFT-based applications on Stellar.

---

## ⚙️ What it does

* 🎨 Mint NFTs with unique token IDs
* 🧾 Store ownership and metadata on-chain
* 🔄 Transfer NFTs securely between users
* 🔍 Retrieve NFT details anytime

---

## ✨ Features

* 🔹 **NFT Minting**
  Create unique NFTs with token ID and metadata

* 🔹 **Ownership Tracking**
  Each NFT is tied to a specific wallet address

* 🔹 **Secure Transfers**
  Only the owner can transfer their NFT

* 🔹 **On-chain Storage**
  Data is stored securely on the blockchain

* 🔹 **Lightweight & Fast**
  Powered by Soroban for efficiency

---

## 🖼️ Architecture Overview

![Architecture Diagram](https://miro.medium.com/v2/resize\:fit:1400/1*Z5vT2z4Q4Z1c6z0sQK5QbA.png)

**Flow:**

1. User calls `mint()`
2. Smart contract stores NFT data
3. User can transfer via `transfer()`
4. Anyone can query using `get_nft()`

---

## 🔗 Useful Links

* 🌐 Stellar Official Docs
  https://developers.stellar.org/

* 📘 Soroban Smart Contracts Guide
  https://developers.stellar.org/docs/smart-contracts

* 🧪 Stellar Testnet
  https://laboratory.stellar.org/

---

## 🔗 Deployed Smart Contract Link



```
https://stellar.expert/explorer/testnet/contract/CDVCJKX6FJFOOQ76BJ365SJS6OTGH2ZQF6QVJO5YGGR37QBJ3I2QB7PZ
```

---

## 🛠️ Tech Stack

* 🦀 Rust (Soroban SDK)
* 🌌 Stellar Blockchain
* ⚡ Soroban Smart Contracts

---

## 📦 How to Deploy

### 1️⃣ Build the Contract

```bash
cargo build --target wasm32-unknown-unknown --release
```

---

### 2️⃣ Optimize WASM (Recommended)

```bash
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/your_contract.wasm
```

---

### 3️⃣ Deploy Contract

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/your_contract.wasm \
  --source YOUR_ACCOUNT \
  --network testnet \
  --alias nft_platform
```

---

### 4️⃣ Interact with Contract

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source YOUR_ACCOUNT \
  --network testnet \
  -- \
  mint \
  --to YOUR_ADDRESS \
  --token_id 1 \
  --metadata ABC123
```

---

## 📸 Example Output

![CLI Example](https://miro.medium.com/v2/resize\:fit:1400/1*GZzKzKzKz_example_cli.png)

---

## 📚 Future Improvements

* 🛒 NFT Marketplace (Buy/Sell)
* 🌐 IPFS Metadata Storage
* 💰 Royalty System for Creators
* 🎯 Batch Minting
* 🖥️ Frontend (React + Wallet Integration)

---

## 👨‍💻 Author

Arpan Basak

gmail: arpanbasak90@gmail.com

GitHub: https://github.com/arpanbasak90-cyber

---

## 📜 License

MIT License

Smart_Contract_Image:

![ee](https://github.com/user-attachments/assets/ea57dbb4-dee7-4576-9260-eccaa3caa5b0)





---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
