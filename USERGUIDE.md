# StellarMint — User Guide

A step-by-step guide for new users to start minting NFTs on Stellar Soroban.

---

## Table of Contents

1. [What is StellarMint?](#1-what-is-stellarmint)
2. [Prerequisites](#2-prerequisites)
3. [Setting Up Your Wallet](#3-setting-up-your-wallet)
4. [Getting Testnet XLM (Free)](#4-getting-testnet-xlm-free)
5. [Connecting Your Wallet](#5-connecting-your-wallet)
6. [Minting Your First NFT](#6-minting-your-first-nft)
7. [Transferring an NFT](#7-transferring-an-nft)
8. [Burning an NFT](#8-burning-an-nft)
9. [Batch Operations](#9-batch-operations)
10. [Verifying Transactions on Explorer](#10-verifying-transactions-on-explorer)
11. [Switching to Mainnet](#11-switching-to-mainnet)
12. [Troubleshooting](#12-troubleshooting)
13. [FAQ](#13-faq)

---

## 1. What is StellarMint?

StellarMint is a production-ready NFT minting and management platform built on **Stellar Soroban** smart contracts. It allows you to:

- ✅ Mint NFTs with custom metadata on Stellar blockchain
- ✅ Transfer NFTs to any Stellar wallet address
- ✅ Burn (permanently destroy) NFTs
- ✅ Batch mint up to 50 NFTs in a single transaction (~65% fee savings)
- ✅ Track all on-chain activity with verifiable transaction hashes

**Live application:** https://nft-minting-platform-2.vercel.app

---

## 2. Prerequisites

Before you start, you need:

| Requirement | Why | Link |
|---|---|---|
| **Chrome or Firefox** browser | Freighter extension required | — |
| **Freighter wallet** extension | To sign on-chain transactions | [freighter.app](https://freighter.app) |
| **XLM balance** | To pay transaction fees (near-zero) | See Section 4 |

> 💡 **No XLM for testnet?** The Stellar testnet has a free "Friendbot" that gives you 10,000 test XLM instantly. See Section 4.

---

## 3. Setting Up Your Wallet

### Step 1 — Install Freighter

1. Go to [freighter.app](https://freighter.app)
2. Click **Add to Chrome** (or Firefox)
3. After installation, click the extension icon in your browser toolbar
4. Click **Create New Wallet**
5. Write down your 12-word seed phrase and store it safely
6. Set a strong password

### Step 2 — Copy Your Public Key

1. Open Freighter
2. Your public key starts with `G` and is 56 characters long
3. Click the copy icon next to your address
4. This is your **Stellar wallet address** — you'll need it to receive NFTs

---

## 4. Getting Testnet XLM (Free)

For testnet, XLM is free. Follow these steps:

**Method A — Stellar Laboratory (Easiest)**

1. Go to [laboratory.stellar.org/#account-creator?network=test](https://laboratory.stellar.org/#account-creator?network=test)
2. It will show your wallet address
3. Click **"Get test network lumens"**
4. Your wallet will receive 10,000 test XLM in seconds

**Method B — Friendbot URL**

Visit this URL in your browser (replace `YOUR_ADDRESS` with your G... address):
```
https://friendbot.stellar.org/?addr=YOUR_ADDRESS
```

**Verify your balance:**
After funding, open the app, connect your wallet, and your XLM balance will appear in the top-left dashboard card.

---

## 5. Connecting Your Wallet

1. Open [nft-minting-platform-2.vercel.app](https://nft-minting-platform-2.vercel.app)
2. You'll see the landing page with the **"Unlock Stellar Portal"** button
3. Click it — a wallet selection modal appears
4. Click **"Freighter"**
5. Freighter will ask you to approve the connection — click **"Approve"**
6. Your wallet address and XLM balance will appear in the dashboard

> ⚠️ **Make sure the network is set correctly.** For testing, keep it on **Testnet**. For real NFTs, switch to **Mainnet** (see Section 11).

---

## 6. Minting Your First NFT

1. In the left sidebar, click **🎨 Mint**
2. Fill in the form:
   - **NFT Name** — e.g., `"Genesis Dragon #1"`
   - **Token ID** — a unique number (e.g., `1`). Each ID can only be used once.
   - **Metadata Hash** — click the 🎲 **Randomize** button to auto-generate a SHA-256 metadata hash
   - **Royalty %** — optional, 0–100
3. Click **Mint NFT**
4. **Freighter will open** asking you to approve and sign the transaction
5. Review the transaction details and click **"Approve"**
6. Wait 3–10 seconds for Stellar blockchain confirmation
7. ✅ **Success!** You'll see a toast notification with your transaction hash and a direct link to the Stellar explorer

**Your NFT will appear in the Gallery tab.**

---

## 7. Transferring an NFT

1. Click **🔄 Transfer** in the sidebar
2. Enter the **Token ID** of the NFT you want to transfer
3. Enter the **Recipient Address** (a valid Stellar G... address)
4. Click **Transfer NFT**
5. Approve in Freighter
6. ✅ The NFT ownership moves to the recipient on-chain

---

## 8. Burning an NFT

> ⚠️ **Burn is permanent and irreversible.** The NFT is destroyed forever.

1. Click **🔥 Burn** in the sidebar
2. Enter the **Token ID** to burn
3. Click **Burn NFT**
4. Approve in Freighter
5. ✅ NFT is permanently removed from the blockchain

---

## 9. Batch Operations

StellarMint supports minting and transferring multiple NFTs in a **single transaction**, saving ~65% in fees.

### Batch Mint

1. Click **⚡ Batch** in the sidebar
2. Use the batch mint form — enter multiple Token IDs and names (comma-separated)
3. Click **Batch Mint**
4. Approve once in Freighter — all NFTs mint in one atomic transaction

### Batch Transfer

Similar process — enter multiple Token IDs and the recipient address.

---

## 10. Verifying Transactions on Explorer

Every successful transaction in StellarMint shows:
- A **transaction hash** (64-character hex string)
- A **🔗 Explorer** link

Click the Explorer link to open the transaction on:
- **Testnet:** [testnet.stellar.expert](https://testnet.stellar.expert)
- **Mainnet:** [stellar.expert](https://stellar.expert)

You'll see the full transaction details including:
- The wallet that signed it
- The contract that was called
- The exact function parameters
- The ledger it was included in

---

## 11. Switching to Mainnet

> ⚠️ **Mainnet uses real XLM.** Transactions cost real money (though fees are tiny — ~0.0001 XLM per operation).

1. Click the **network selector** in the top bar (shows `Testnet` by default)
2. Select **Mainnet** from the dropdown
3. A warning toast will appear: *"MAINNET — real XLM required"*
4. Ensure your Freighter wallet has at least **1 XLM** for transaction fees
5. All subsequent transactions will be submitted to Stellar Mainnet

**Mainnet contract address:**  
`CDD3R5VFJNSEAU3XIQURQNPU4PJMDMFJRB3WMVKEGMRBCAFKXPGN2PJL`

**Mainnet explorer:**  
[stellar.expert/explorer/public/contract/CDD3R5...](https://stellar.expert/explorer/public/contract/CDD3R5VFJNSEAU3XIQURQNPU4PJMDMFJRB3WMVKEGMRBCAFKXPGN2PJL)

---

## 12. Troubleshooting

| Problem | Solution |
|---|---|
| "Freighter not detected" | Install Freighter extension and refresh the page |
| "Freighter is not connected" | Open Freighter and unlock your wallet |
| "Account not found" | Your wallet isn't funded. Use Friendbot (testnet) or send XLM to your address |
| "Transaction simulation failed" | Check that Token ID doesn't already exist and wallet owns the NFT |
| "Transaction FAILED on-chain" | Insufficient XLM balance or Token ID conflict. Check the explorer link. |
| App doesn't load | Clear browser cache and hard-refresh (Ctrl+Shift+R) |
| NFT Gallery empty after refresh | NFTs are stored in localStorage — check if browser storage is enabled |

---

## 13. FAQ

**Q: Do I need to pay gas/fees?**  
A: Yes, but fees are near-zero on Stellar. Each transaction costs ~0.0001 XLM (~$0.00005).

**Q: Can I use MetaMask?**  
A: No — MetaMask is for Ethereum. Stellar uses its own wallets: Freighter, Albedo, xBull, LOBSTR.

**Q: Are my NFTs stored on IPFS?**  
A: Currently, metadata is stored as a 32-byte hash on-chain. IPFS pinning is on the Q4 2026 roadmap.

**Q: What happens if I lose my seed phrase?**  
A: Your wallet (and all NFTs owned by it) is permanently inaccessible. **Always backup your seed phrase.**

**Q: Can I mint NFTs on mainnet for free?**  
A: No — mainnet requires real XLM. Testnet is completely free.

**Q: Is there a maximum number of NFTs I can mint?**  
A: The current collection cap is 100 NFTs. This is configurable in the Settings tab.

**Q: Can two users have the same Token ID?**  
A: No. Token IDs are globally unique within a contract. If you try to mint with an existing ID, the transaction will fail.

---

*For support, open an issue at [github.com/arpanbasak90-cyber/NFT-Minting-Platform/issues](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform/issues)*
