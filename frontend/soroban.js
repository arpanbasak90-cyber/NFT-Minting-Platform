/**
 * Stellar & Soroban Smart Contract Integration Service
 * Supports BOTH Stellar Testnet and Mainnet with dynamic network switching.
 * All transactions require Freighter wallet. No fake tx hashes generated.
 */

// ── Contract Addresses ─────────────────────────────────────────────────
const CONTRACTS = {
    testnet: "CDD3R5VFJNSEAU3XIQURQNPU4PJMDMFJRB3WMVKEGMRBCAFKXPGN2PJL",
    mainnet: "CDD3R5VFJNSEAU3XIQURQNPU4PJMDMFJRB3WMVKEGMRBCAFKXPGN2PJL"  // same contract, deployed on both
};

// ── Network Endpoints ──────────────────────────────────────────────────
const NETWORKS = {
    testnet: {
        rpcUrl:           "https://soroban-testnet.stellar.org",
        horizonUrl:       "https://horizon-testnet.stellar.org",
        passphrase:       "Test SDF Network ; September 2015",
        explorerBase:     "https://testnet.stellar.expert/explorer/testnet",
        friendbotUrl:     "https://friendbot.stellar.org"
    },
    mainnet: {
        rpcUrl:           "https://mainnet.sorobanrpc.com",
        horizonUrl:       "https://horizon.stellar.org",
        passphrase:       "Public Global Stellar Network ; September 2015",
        explorerBase:     "https://stellar.expert/explorer/public",
        friendbotUrl:     null
    }
};

// Active network — synced with app.js via window.activeNetwork
function getActiveNetwork() {
    return (typeof window !== "undefined" && window.activeNetwork) || "testnet";
}

function getNetworkConfig() {
    return NETWORKS[getActiveNetwork()] || NETWORKS.testnet;
}

function getContractId() {
    return CONTRACTS[getActiveNetwork()] || CONTRACTS.testnet;
}

function getExplorerUrl(txHash) {
    return `${getNetworkConfig().explorerBase}/tx/${txHash}`;
}

function getContractExplorerUrl() {
    const cfg = getNetworkConfig();
    const id  = getContractId();
    return `${cfg.explorerBase}/contract/${id}`;
}

// ── Helpers ────────────────────────────────────────────────────────────
function hexToBytes(hex) {
    const cleanHex = (hex || "").trim().replace(/^0x/, "");
    const paddedHex = cleanHex.padEnd(64, "0").substring(0, 64);
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(paddedHex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function bytesToHex(uint8Array) {
    if (!uint8Array) return "00".repeat(32);
    return Array.from(uint8Array).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getSorobanServer() {
    if (!window.StellarSdk) return null;
    return new window.StellarSdk.SorobanRpc.Server(getNetworkConfig().rpcUrl);
}

// ── Wallet Connection ──────────────────────────────────────────────────
function getFreighterApi() {
    const api = window.freighterApi || window.stellar;
    if (!api) {
        throw new Error(
            "Freighter wallet not detected. Install from https://freighter.app and refresh."
        );
    }
    return api;
}

async function connectFreighterWallet() {
    const api = getFreighterApi();
    const connected = await api.isConnected();
    if (!connected) throw new Error("Freighter is not active. Please unlock your wallet.");
    const userAllowed = await api.isAllowed();
    if (!userAllowed) await api.getPublicKey();
    return await api.getPublicKey();
}

async function checkWalletConnection() {
    try {
        const api = window.freighterApi || window.stellar;
        if (api && await api.isConnected()) {
            return await api.getPublicKey();
        }
    } catch (e) {
        console.warn("Wallet connection check:", e);
    }
    return null;
}

// ── Read-only Simulation ───────────────────────────────────────────────
async function simulateContractCall(functionName, args = []) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const cfg = getNetworkConfig();
    const contractId = getContractId();
    const sorobanServer = getSorobanServer();

    let pk = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    try {
        const api = window.freighterApi || window.stellar;
        if (api) {
            const connectedPk = await api.getPublicKey();
            if (connectedPk) pk = connectedPk;
        }
    } catch { /* fallback to dummy */ }

    const contract  = new window.StellarSdk.Contract(contractId);
    const operation = contract.call(functionName, ...args);
    const account   = new window.StellarSdk.Account(pk, "0");

    const tx = new window.StellarSdk.TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: cfg.passphrase,
    })
    .addOperation(operation)
    .setTimeout(window.StellarSdk.TimeoutInfinite)
    .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (!window.StellarSdk.SorobanRpc.Api.isSimulationSuccess(sim)) {
        throw new Error(`Simulation of '${functionName}' failed: ${JSON.stringify(sim.error || sim)}`);
    }
    if (sim.results?.[0]?.xdr) {
        return window.StellarSdk.xdr.ScVal.fromXDR(sim.results[0].xdr, "base64");
    }
    return null;
}

// ── Core Transaction Builder ───────────────────────────────────────────
/**
 * Executes a mutating Soroban contract call via Freighter.
 * Returns a real on-chain tx hash — no fake hashes ever generated.
 */
async function executeContractTransaction(functionName, args = []) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const cfg        = getNetworkConfig();
    const contractId = getContractId();
    const sorobanServer = getSorobanServer();

    const api = window.freighterApi || window.stellar;
    if (!api || typeof api.isConnected !== "function") {
        throw new Error("Freighter wallet is required. Install from https://freighter.app");
    }
    if (!await api.isConnected()) {
        throw new Error("Freighter is not connected. Please unlock your wallet.");
    }
    const pk = await api.getPublicKey();
    if (!pk) throw new Error("Could not retrieve public key from Freighter.");

    const horizonServer = new window.StellarSdk.Horizon.Server(cfg.horizonUrl);
    const account = await horizonServer.loadAccount(pk);

    const contract  = new window.StellarSdk.Contract(contractId);
    const operation = contract.call(functionName, ...args);

    const tx = new window.StellarSdk.TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: cfg.passphrase,
    })
    .addOperation(operation)
    .setTimeout(window.StellarSdk.TimeoutInfinite)
    .build();

    const sim = await sorobanServer.simulateTransaction(tx);
    if (!window.StellarSdk.SorobanRpc.Api.isSimulationSuccess(sim)) {
        throw new Error(`Simulation failed: ${JSON.stringify(sim.error || sim)}`);
    }

    const assembledTx = window.StellarSdk.assembleTransaction(tx, sim);
    const signedXdr   = await api.signTransaction(assembledTx.toXDR(), {
        networkPassphrase: cfg.passphrase,
    });

    const signedTx  = window.StellarSdk.TransactionBuilder.fromXDR(signedXdr, cfg.passphrase);
    const submitRes = await sorobanServer.sendTransaction(signedTx);

    if (!submitRes || submitRes.status === "ERROR") {
        throw new Error(`Submission failed: ${JSON.stringify(submitRes?.errorResult || submitRes)}`);
    }

    const txHash = submitRes.hash;
    const explorerUrl = getExplorerUrl(txHash);
    console.log(`[Soroban] Tx submitted. Hash: ${txHash}`);
    console.log(`[Explorer] ${explorerUrl}`);

    // Poll for confirmation (30 × 2s = 60s)
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const txStatus = await sorobanServer.getTransaction(txHash);
        if (txStatus.status === "SUCCESS") {
            return { status: "SUCCESS", hash: txHash, explorerUrl, result: txStatus.resultMetaXdr };
        }
        if (txStatus.status === "FAILED") {
            throw new Error(`On-chain FAILED. Explorer: ${explorerUrl}`);
        }
    }
    return { status: "PENDING", hash: txHash, explorerUrl };
}

// ── Fee-Bump (Gasless Sponsorship) ─────────────────────────────────────
/**
 * Level 6 Advanced Feature: Fee Bump Transaction
 * Allows a sponsor wallet to pay fees for a user's transaction.
 * This enables gasless minting for onboarding non-crypto native users.
 *
 * @param {string} innerXdr   - Signed inner transaction XDR (from user's Freighter)
 * @param {string} sponsorPk  - Sponsor's public key (fee payer)
 * @returns {object}          - { status, hash, explorerUrl }
 */
async function executeFeeBumpTransaction(innerXdr, sponsorPk) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const cfg = getNetworkConfig();
    const sorobanServer = getSorobanServer();
    const api = getFreighterApi();

    const innerTx = window.StellarSdk.TransactionBuilder.fromXDR(innerXdr, cfg.passphrase);

    const feeBumpTx = window.StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
        sponsorPk,          // fee source (sponsor pays)
        "200",              // base fee (stroops per op)
        innerTx,
        cfg.passphrase
    );

    // Sponsor signs the fee-bump envelope
    const feeBumpXdr = await api.signTransaction(feeBumpTx.toXDR(), {
        networkPassphrase: cfg.passphrase,
    });

    const signedFeeBump = window.StellarSdk.TransactionBuilder.fromXDR(feeBumpXdr, cfg.passphrase);
    const submitRes     = await sorobanServer.sendTransaction(signedFeeBump);

    if (!submitRes || submitRes.status === "ERROR") {
        throw new Error(`Fee-bump submission failed: ${JSON.stringify(submitRes?.errorResult)}`);
    }

    const txHash = submitRes.hash;
    return { status: "SUCCESS", hash: txHash, explorerUrl: getExplorerUrl(txHash), feeBump: true };
}

// ── Smart Contract Functions ───────────────────────────────────────────

async function mint(to, token_id, metadataHex, name) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const args = [
        window.StellarSdk.Address.fromString(to).toScVal(),
        window.StellarSdk.nativeToScVal(token_id, { type: "u64" }),
        window.StellarSdk.xdr.ScVal.scvBytes(hexToBytes(metadataHex)),
        window.StellarSdk.nativeToScVal(name, { type: "string" })
    ];
    return await executeContractTransaction("mint", args);
}

async function transfer(from, to, token_id) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const args = [
        window.StellarSdk.Address.fromString(from).toScVal(),
        window.StellarSdk.Address.fromString(to).toScVal(),
        window.StellarSdk.nativeToScVal(token_id, { type: "u64" })
    ];
    return await executeContractTransaction("transfer", args);
}

async function burn(owner, token_id) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const args = [
        window.StellarSdk.Address.fromString(owner).toScVal(),
        window.StellarSdk.nativeToScVal(token_id, { type: "u64" })
    ];
    return await executeContractTransaction("burn", args);
}

async function get_nft(token_id) {
    if (!window.StellarSdk) return null;
    try {
        const args = [window.StellarSdk.nativeToScVal(token_id, { type: "u64" })];
        const val  = await simulateContractCall("get_nft", args);
        if (val) {
            const native = window.StellarSdk.scValToNative(val);
            return { status: "SUCCESS", token_id: Number(native.token_id), owner: native.owner, name: native.name, metadata: bytesToHex(native.metadata) };
        }
    } catch (e) { console.error("get_nft:", e); }
    return null;
}

async function get_owner(token_id) {
    if (!window.StellarSdk) return null;
    try {
        const args = [window.StellarSdk.nativeToScVal(token_id, { type: "u64" })];
        const val  = await simulateContractCall("get_owner", args);
        if (val) return window.StellarSdk.scValToNative(val);
    } catch (e) { console.error("get_owner:", e); }
    return null;
}

async function total_supply() {
    if (!window.StellarSdk) return 0;
    try {
        const val = await simulateContractCall("total_supply");
        if (val) return Number(window.StellarSdk.scValToNative(val));
    } catch (e) { console.error("total_supply:", e); }
    return 0;
}

async function measureRpcLatency() {
    const start = performance.now();
    try {
        await fetch(getNetworkConfig().rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
            signal: AbortSignal.timeout(5000)
        });
        return Math.round(performance.now() - start);
    } catch { return null; }
}

// ── Public API ─────────────────────────────────────────────────────────
const SorobanIntegration = {
    connectFreighterWallet,
    checkWalletConnection,
    mint,
    transfer,
    burn,
    get_nft,
    get_owner,
    total_supply,
    measureRpcLatency,
    executeFeeBumpTransaction,
    getExplorerUrl,
    getContractExplorerUrl,
    getContractId,
    getNetworkConfig,
    CONTRACTS,
    NETWORKS
};

if (typeof window !== "undefined") {
    window.SorobanIntegration = SorobanIntegration;
}
