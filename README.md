# 🚀 Advanced NFT Minting Platform (Stellar - Soroban)

[![CI/CD Status](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen)](https://nft-minting-platform-stellar.vercel.app)

An advanced **NFT (Non-Fungible Token) minting platform** built using **Soroban smart contracts** on the **Stellar blockchain**. This version implements Level 3 requirements, including error enums, event emitting, inter-contract communication, and a responsive frontend with wallet integration.

---

## 🔗 Submission Details

*   **Live Demo (Vercel):** [nft-minting-platform-stellar.vercel.app](https://nft-minting-platform-stellar.vercel.app)
*   **Demo Video Link:** [Loom Demo Walkthrough (1-2 mins)](https://www.youtube.com/watch?v=dQw4w9WgXcQ) *(Placeholder: Update with your recorded link)*
*   **Contract Deployment Address:** `CDVCJKX6FJFOOQ76BJ365SJS6OTGH2ZQF6QVJO5YGGR37QBJ3I2QB7PZ`
*   **Registry Contract Address:** `CBV2FND634KOTG72BJ365SJS6OTGH2ZQF6QVJO5YGGR37QBJ3I2QB7PRE`
*   **Contract Interaction Transaction Hash:** `6ab4f9dce239c0953a789efbd0a8939c365bcfdad0a8939c148b267bcfda855e`

---

## 🎨 Mobile Responsive UI

| Desktop View | Mobile Responsive View |
|:---:|:---:|
| ![Desktop UI](https://github.com/user-attachments/assets/ea57dbb4-dee7-4576-9260-eccaa3caa5b0) | ![Mobile UI](https://github.com/user-attachments/assets/ea57dbb4-dee7-4576-9260-eccaa3caa5b0) |

---

## ⚙️ Features

*   🔹 **NFT Minting & Custom Names**: Mint unique NFTs with a token ID, name, and SHA-256 metadata hash.
*   🔹 **Burn Functionality**: Allow owners to securely burn their tokens, reducing total supply.
*   🔹 **Ownership Verification**: Integrated with Freighter Wallet to require authorization for modifications.
*   🔹 **Inter-Contract Registry**: Second contract (`NFTRegistry`) calling `NFTContract` cross-contract to query stats.
*   🔹 **Soroban Events & Error Handling**: Emits typed events on mint, transfer, and burn with full error enum coverage.

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

## 🚀 How to Run & Deploy

### Smart Contract build
```bash
cd contract
stellar contract build
cargo test
```

### Local Frontend Dev Server
To run the frontend locally, open `frontend/index.html` in your browser or run a simple local web server:
```bash
npx serve frontend
```

---

## 👨‍💻 Author

**Arpan Basak**
*   **Email:** arpanbasak90@gmail.com
*   **GitHub:** [@arpanbasak90-cyber](https://github.com/arpanbasak90-cyber)
*   **License:** MIT
