# 🚀 StellarMint — Advanced Soroban NFT Platform

[![CI/CD Status](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-brightgreen)](https://nft-minting-platform-2.vercel.app)

A next-generation, premium **NFT Minting & Management Platform** powered by **Soroban Smart Contracts** on the **Stellar Blockchain**. Featuring a gorgeous, responsive, glassmorphic dark-mode dashboard with real wallet SDK integrations.

---

## 🔗 Submission Details

*   **Live Demo (Vercel):** [nft-minting-platform-2.vercel.app](https://nft-minting-platform-2.vercel.app)
*   **Demo Video Link:** [Loom Demo Walkthrough (1-2 mins)](https://www.youtube.com/watch?v=dQw4w9WgXcQ) *(Placeholder: Update with your recorded link)*
*   **GitHub Repository:** [github.com/arpanbasak90-cyber/NFT-Minting-Platform](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform)

---

## ⚡ Key Premium Features (10+)

1.  **🔒 Landing Page Access Gate:** Modern entry screen. Main app layout, sidebar, and dashboard are completely locked behind wallet connection status.
2.  **👛 Real Wallet SDKs Integration:** Fully functional integration with **Freighter**, **Albedo**, and **xBull** browser wallets (no simulations or browser prompts).
3.  **💰 Live Horizon Balance Fetcher:** Queries real-time native XLM balances directly from the Stellar Horizon API (`https://horizon-testnet.stellar.org`) upon connection.
4.  **🎨 Glassmorphic Dark/Light Mode:** Vibrant, curated color palette with beautiful micro-animations, glass cards, and a toggle-switch theme syncing across all views.
5.  **🖼️ Searchable & Sortable NFT Gallery:** Search minted NFTs globally by ID or name, and sort them dynamically by ID (ascending/descending) or name.
6.  **📊 Real-time Latency RPC Tracker:** Actively pings the Stellar RPC node every few seconds and displays current network latency inside the sidebar.
7.  **💾 CSV Data Exporter:** One-click CSV exporter for both the **Activity Feed** and **Transaction Center** data tables.
8.  **⚡ Quick Mint Templates:** Choose preset templates (e.g. Art, Gaming, Music) to instantly auto-fill token names, descriptions, and custom royalty percentages.
9.  **🛠️ Custom Metadata Generator:** In-app generator that computes a SHA-256 metadata hash in real-time from the collection name and token ID.
10. **⚙️ Collection Cap & Settings Panel:** Allows modifying the collection cap locally (with automated progress bar UI) and switching RPC network nodes.
11. **🔔 Real-time Notifications & logs:** In-app toast popups, notification feed, and a detailed runtime transaction log history console.

---

## 🎨 Mobile Responsive UI

| Desktop View | Mobile Responsive View |
|:---:|:---:|
| ![Desktop UI](https://github.com/user-attachments/assets/ea57dbb4-dee7-4576-9260-eccaa3caa5b0) | ![Mobile UI](https://github.com/user-attachments/assets/ea57dbb4-dee7-4576-9260-eccaa3caa5b0) |

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

### Smart Contract Build
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
