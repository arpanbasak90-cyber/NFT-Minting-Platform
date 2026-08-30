# Building Production-Ready NFT dApps on Stellar Soroban

**A complete technical guide for builders entering the Stellar ecosystem**

---

## Introduction

Stellar's Soroban smart contract platform offers developers a Rust-native, WebAssembly-compiled smart contract environment with sub-second finality and near-zero fees. This guide walks through every step of building a production-ready NFT minting platform on Soroban — from contract design through frontend integration, CI/CD pipeline setup, and mainnet deployment.

This article accompanies the open-source **StellarMint** project:  
🔗 [github.com/arpanbasak90-cyber/NFT-Minting-Platform](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform)  
🌐 [nft-minting-platform-2.vercel.app](https://nft-minting-platform-2.vercel.app)

---

## Table of Contents

1. [Why Stellar Soroban?](#1-why-stellar-soroban)
2. [Project Architecture](#2-project-architecture)
3. [Writing the NFT Smart Contract](#3-writing-the-nft-smart-contract)
4. [Inter-Contract Communication (Registry Pattern)](#4-inter-contract-communication)
5. [Compiling to WASM and Testing](#5-compiling-to-wasm-and-testing)
6. [Deploying to Testnet and Mainnet](#6-deploying-to-testnet-and-mainnet)
7. [Frontend Integration with Stellar SDK](#7-frontend-integration-with-stellar-sdk)
8. [Freighter Wallet Integration](#8-freighter-wallet-integration)
9. [Fee Bump — Gasless Transactions](#9-fee-bump-gasless-transactions)
10. [CI/CD Pipeline for Soroban Projects](#10-cicd-pipeline-for-soroban-projects)
11. [Security Best Practices](#11-security-best-practices)
12. [Lessons Learned](#12-lessons-learned)

---

## 1. Why Stellar Soroban?

| Feature | Ethereum/Solidity | Stellar/Soroban |
|---|---|---|
| Smart contract language | Solidity | **Rust** (memory-safe, type-safe) |
| Compilation target | EVM bytecode | **WASM** (portable, deterministic) |
| Transaction fees | $1–$50+ (gas wars) | **~$0.00001** (fixed, predictable) |
| Finality | ~12 seconds | **3–5 seconds** |
| Account model | Account-based | **Account + Ledger entries** |
| Tooling | Hardhat, Foundry | **Stellar CLI, cargo** |

Soroban's Rust SDK provides a safe, ergonomic API for writing smart contracts with full compile-time checks on storage access, authorization, and cross-contract calls.

---

## 2. Project Architecture

```
┌─────────────────────────────────────┐
│           Stellar Blockchain         │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ NFT Contract │◄─│  Registry   │ │
│  │  (mint, burn │  │  Contract   │ │
│  │  transfer)   │  │ (cross-call)│ │
│  └──────────────┘  └─────────────┘ │
└────────────────┬────────────────────┘
                 │ Soroban RPC
         ┌───────▼────────┐
         │  Frontend       │
         │  (vanilla JS)   │
         │  Stellar SDK    │
         └───────┬─────────┘
                 │
         ┌───────▼─────────┐
         │  Freighter/     │
         │  Albedo Wallet  │
         └─────────────────┘
```

Two contracts:
- **NFT Contract** — mint, batch mint, transfer, batch transfer, burn, query
- **Registry Contract** — registers NFT collections, calls NFT contract's `total_supply()` via cross-contract invocation

---

## 3. Writing the NFT Smart Contract

```rust
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, String, Vec};

#[contracttype]
pub struct NFTData {
    pub owner:    Address,
    pub token_id: u64,
    pub metadata: BytesN<32>,
    pub name:     String,
}

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {
    /// Mint a single NFT — requires authorization from `to`
    pub fn mint(env: Env, to: Address, token_id: u64, metadata: BytesN<32>, name: String) {
        to.require_auth();

        // Prevent duplicate minting
        let key = (Symbol::new(&env, "nft"), token_id);
        if env.storage().instance().has(&key) {
            panic!("Token ID already minted");
        }

        let nft = NFTData { owner: to.clone(), token_id, metadata, name };
        env.storage().instance().set(&key, &nft);

        // Update total supply
        let supply: u64 = env.storage().instance().get(&Symbol::new(&env, "supply")).unwrap_or(0);
        env.storage().instance().set(&Symbol::new(&env, "supply"), &(supply + 1));
    }
}
```

Key patterns used:
- **`require_auth()`** — enforces that the caller owns the address being minted to
- **`env.storage().instance()`** — per-contract storage with automatic TTL management
- **Panic on duplicate** — prevents double-minting at the contract level

---

## 4. Inter-Contract Communication

The Registry contract calls into the NFT contract using a client generated from the NFT contract's interface:

```rust
// In registry/src/lib.rs
mod nft_contract {
    soroban_sdk::contractimport!(
        file = "../../contract/target/wasm32-unknown-unknown/release/contract.wasm"
    );
}

pub fn register_collection(
    env: Env,
    creator: Address,
    nft_contract_id: Address,
    name: String,
) {
    creator.require_auth();
    let nft_client = nft_contract::Client::new(&env, &nft_contract_id);
    let supply = nft_client.total_supply(); // cross-contract call
    // ... store collection entry
}
```

This is a **read-only cross-contract call** — safe and gas-efficient.

---

## 5. Compiling to WASM and Testing

```bash
# Add the WASM target
rustup target add wasm32-unknown-unknown

# Run unit tests (native target — fast)
cd contract
cargo test --workspace

# Build WASM contracts (release mode)
cargo build --target wasm32-unknown-unknown --release
# Output: target/wasm32-unknown-unknown/release/contract.wasm
#         target/wasm32-unknown-unknown/release/registry.wasm
```

**Critical CI tip:** Run `cargo test` on the **native target** first, then build WASM separately. This avoids CI runner memory issues from doing both in the same job.

### Example Unit Test

```rust
#[test]
fn test_mint_and_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, NFTContract);
    let client = NFTContractClient::new(&env, &contract_id);
    
    let alice = Address::generate(&env);
    let bob   = Address::generate(&env);
    let meta  = BytesN::from_array(&env, &[0u8; 32]);
    
    client.mint(&alice, &1u64, &meta, &String::from_str(&env, "Genesis #1"));
    assert_eq!(client.get_owner(&1u64), alice);
    
    client.transfer(&alice, &bob, &1u64);
    assert_eq!(client.get_owner(&1u64), bob);
}
```

---

## 6. Deploying to Testnet and Mainnet

### Testnet

```bash
# Generate and fund deployer key
stellar keys generate deployer --network testnet
curl "https://friendbot.stellar.org/?addr=$(stellar keys address deployer)"

# Deploy NFT contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contract.wasm \
  --source-account deployer \
  --network testnet
# → Copy the contract ID output
```

### Mainnet

```bash
# Fund deployer with real XLM first (minimum ~5 XLM for reserve + fees)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contract.wasm \
  --source-account deployer \
  --network mainnet
```

> ⚠️ Mainnet WASM upload costs ~1–2 XLM per contract for storage rent. Ensure your deployer has sufficient balance.

---

## 7. Frontend Integration with Stellar SDK

Load the Stellar SDK from CDN (no bundler needed for a pure frontend):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/12.0.0/stellar-sdk.min.js"></script>
```

Building and submitting a Soroban transaction:

```javascript
const contractId   = "C...your_contract_id...";
const rpcUrl       = "https://soroban-testnet.stellar.org";
const passphrase   = "Test SDF Network ; September 2015";
const sorobanServer = new StellarSdk.SorobanRpc.Server(rpcUrl);
const horizonServer = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

async function mintNFT(userPk, tokenId, metadata, name) {
    const account   = await horizonServer.loadAccount(userPk);
    const contract  = new StellarSdk.Contract(contractId);
    const args = [
        StellarSdk.Address.fromString(userPk).toScVal(),
        StellarSdk.nativeToScVal(tokenId, { type: "u64" }),
        StellarSdk.xdr.ScVal.scvBytes(hexToBytes(metadata)),
        StellarSdk.nativeToScVal(name, { type: "string" })
    ];

    const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "10000", networkPassphrase: passphrase
    })
    .addOperation(contract.call("mint", ...args))
    .setTimeout(StellarSdk.TimeoutInfinite)
    .build();

    // Simulate to get footprint
    const sim = await sorobanServer.simulateTransaction(tx);
    const assembled = StellarSdk.assembleTransaction(tx, sim);

    // Sign with Freighter
    const signedXdr = await freighterApi.signTransaction(assembled.toXDR(), { networkPassphrase: passphrase });
    const signedTx  = StellarSdk.TransactionBuilder.fromXDR(signedXdr, passphrase);

    // Submit and poll
    const result = await sorobanServer.sendTransaction(signedTx);
    return result.hash;
}
```

---

## 8. Freighter Wallet Integration

```javascript
// Check if Freighter is installed
const api = window.freighterApi;
if (!api) { alert("Install Freighter: https://freighter.app"); return; }

// Connect
const isConnected = await api.isConnected();
if (!isConnected) { /* prompt user */ }
const publicKey = await api.getPublicKey();

// Sign transaction
const signedXdr = await api.signTransaction(txXdr, {
    networkPassphrase: "Test SDF Network ; September 2015"
});
```

---

## 9. Fee Bump — Gasless Transactions

Fee Bump transactions allow a **sponsor** wallet to pay XLM fees on behalf of users. This is ideal for onboarding users who don't have XLM yet:

```javascript
// Build inner transaction (user's operation — unsigned)
const innerTx = buildMintTransaction(userAccount, ...args);
const sim     = await sorobanServer.simulateTransaction(innerTx);
const assembled = StellarSdk.assembleTransaction(innerTx, sim);

// User signs the inner transaction
const userSignedXdr = await freighterApi.signTransaction(assembled.toXDR(), { networkPassphrase });

// Sponsor wraps it in a fee-bump
const userSignedTx = StellarSdk.TransactionBuilder.fromXDR(userSignedXdr, networkPassphrase);
const feeBump = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
    sponsorPublicKey,  // sponsor pays
    "200",             // base fee
    userSignedTx,
    networkPassphrase
);

// Sponsor signs and submits fee-bump
const sponsorSignedXdr = await sponsorFreighter.signTransaction(feeBump.toXDR(), { networkPassphrase });
const result = await sorobanServer.sendTransaction(
    StellarSdk.TransactionBuilder.fromXDR(sponsorSignedXdr, networkPassphrase)
);
```

---

## 10. CI/CD Pipeline for Soroban Projects

A common pitfall: running `cargo test` and `cargo build --target wasm32-unknown-unknown` in the same CI job causes resource exhaustion on GitHub's runners.

**Solution:** Split into two jobs.

```yaml
# .github/workflows/ci.yml
jobs:
  smart-contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable  # reads rust-toolchain.toml
      - uses: Swatinem/rust-cache@v2
        with: { workspaces: ./contract }
      - name: Run Tests
        run: cargo test --workspace
        working-directory: ./contract
      - name: Build WASM
        run: cargo build --target wasm32-unknown-unknown --release
        working-directory: ./contract
```

**rust-toolchain.toml** (pin a specific Rust version to avoid dependency breaks):
```toml
[toolchain]
channel = "1.96.0"
targets = ["wasm32-unknown-unknown"]
profile = "minimal"
```

---

## 11. Security Best Practices

| Risk | Mitigation |
|---|---|
| Unauthorized minting | Always call `address.require_auth()` before state changes |
| Double-mint | Check `env.storage().instance().has(&key)` before writing |
| Integer overflow | Rust's debug mode panics on overflow; use `checked_add` |
| Unauthorized transfer | Verify `from.require_auth()` and `from == current_owner` |
| Storage bloat | Use `instance()` for frequently accessed state; `persistent()` for user data |
| Reentrancy | Soroban's single-entry-point model prevents reentrancy by default |

---

## 12. Lessons Learned

1. **Always test on native target first** — WASM compilation is slow and masks logic errors. Use `cargo test --workspace` with the native target for rapid iteration.

2. **Soroban's `mock_all_auths()`** — In tests, call this before all operations to bypass the auth system and test logic independently.

3. **Rust version pinning is critical** — Different crate versions require specific Rust toolchains. Pin with `rust-toolchain.toml` to make CI reproducible.

4. **Fee Bump for onboarding** — If your target users don't hold XLM, use Fee Bump to subsidize their first few transactions. This dramatically improves the onboarding conversion rate.

5. **Simulate before submitting** — Always call `sorobanServer.simulateTransaction()` before submitting. The simulation returns the storage footprint needed by the assembled transaction.

---

## Resources

- [Stellar Developer Docs](https://developers.stellar.org/docs/build/smart-contracts)
- [Soroban SDK Reference](https://docs.rs/soroban-sdk)
- [Stellar Laboratory](https://laboratory.stellar.org)
- [StellarMint Source Code](https://github.com/arpanbasak90-cyber/NFT-Minting-Platform)

---

*Written by Arpan Basak — Stellar Builder Challenge participant*
