/**
 * Stellar & Soroban Smart Contract Integration Service
 * Uses CDN globals window.freighterApi and window.StellarSdk
 */

// Deployed Soroban NFT Smart Contract Address on Stellar Testnet
const CONTRACT_ID = "CC7B8P6R54B64L4O5Z3Y7W4M2N9K1J8H3G5F4E3D2C1B";
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

// Initialize Stellar RPC server
const sorobanServer = window.StellarSdk ? new window.StellarSdk.SorobanRpc.Server(RPC_URL) : null;

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
    return Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Get Freighter API instance from window
function getFreighterApi() {
    const api = window.freighterApi || window.stellar;
    if (!api) {
        throw new Error("Freighter wallet extension not detected. Please install Freighter.");
    }
    return api;
}

// ── Wallet Connection using Freighter API ──────────────────────────────
async function connectFreighterWallet() {
    console.log("[Freighter] Checking Freighter wallet connection...");
    const api = getFreighterApi();
    const connected = await api.isConnected();
    if (!connected) {
        throw new Error("Freighter extension not active. Please unlock your wallet.");
    }
    const userAllowed = await api.isAllowed();
    if (!userAllowed) {
        await api.getPublicKey();
    }
    const pk = await api.getPublicKey();
    console.log("[Freighter] Public key retrieved:", pk);
    return pk;
}

async function checkWalletConnection() {
    try {
        const api = window.freighterApi || window.stellar;
        if (api && await api.isConnected()) {
            const pk = await api.getPublicKey();
            return pk;
        }
    } catch (e) {
        console.warn("Wallet connection check failed:", e);
    }
    return null;
}

// ── Read-only Contract Functions (Simulation) ─────────────────────────

async function simulateContractCall(functionName, args = []) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");

    let pk = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"; // dummy source address
    try {
        const api = window.freighterApi || window.stellar;
        if (api) {
            const connectedPk = await api.getPublicKey();
            if (connectedPk) pk = connectedPk;
        }
    } catch {
        // Ignore error and fallback to dummy
    }

    const contract = new window.StellarSdk.Contract(CONTRACT_ID);
    const operation = contract.call(functionName, ...args);
    const dummyAccount = new window.StellarSdk.Account(pk, "0");

    const tx = new window.StellarSdk.TransactionBuilder(dummyAccount, {
        fee: "10000",
        networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(operation)
    .setTimeout(window.StellarSdk.TimeoutInfinite)
    .build();

    console.log(`[Soroban RPC] Simulating contract function: '${functionName}'`);
    const sim = await sorobanServer.simulateTransaction(tx);
    if (!window.StellarSdk.SorobanRpc.Api.isSimulationSuccess(sim)) {
        throw new Error(`Simulation of '${functionName}' failed: ${JSON.stringify(sim.error || sim)}`);
    }

    if (sim.results && sim.results[0] && sim.results[0].xdr) {
        return window.StellarSdk.xdr.ScVal.fromXDR(sim.results[0].xdr, "base64");
    }
    return null;
}

// ── Mutating Contract Functions (Transaction Lifecycle) ─────────────────

async function executeContractTransaction(functionName, args = []) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const api = getFreighterApi();

    const pk = await connectFreighterWallet();
    if (!pk) throw new Error("Wallet authentication failed. Please connect your Freighter wallet.");

    console.log(`[Horizon] Loading account sequence for: ${pk}`);
    const horizonServer = new window.StellarSdk.Horizon.Server(HORIZON_URL);
    const accountSource = await horizonServer.loadAccount(pk);

    const contract = new window.StellarSdk.Contract(CONTRACT_ID);
    const operation = contract.call(functionName, ...args);

    console.log("[Soroban] Building initial transaction...");
    const tx = new window.StellarSdk.TransactionBuilder(accountSource, {
        fee: "10000",
        networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(operation)
    .setTimeout(window.StellarSdk.TimeoutInfinite)
    .build();

    console.log(`[Soroban RPC] Simulating transaction for: '${functionName}'...`);
    const sim = await sorobanServer.simulateTransaction(tx);
    if (!window.StellarSdk.SorobanRpc.Api.isSimulationSuccess(sim)) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(sim.error || sim)}`);
    }

    console.log("[Soroban] Assembling transaction with simulation footprints...");
    const assembledTx = window.StellarSdk.assembleTransaction(tx, sim);

    console.log("[Freighter] Requesting user transaction signature...");
    const signedXdr = await api.signTransaction(assembledTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    console.log("[Soroban RPC] Submitting signed transaction...");
    const signedTx = window.StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    let submitRes = await sorobanServer.sendTransaction(signedTx);
    if (submitRes.status === "ERROR") {
        throw new Error(`RPC submission error: ${submitRes.errorResultXdr || "unknown error"}`);
    }

    const txHash = submitRes.hash;
    console.log(`[Soroban RPC] Transaction submitted successfully. Hash: ${txHash}`);
    console.log("[Soroban RPC] Polling ledger for confirmation...");

    let attempts = 0;
    while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const txStatus = await sorobanServer.getTransaction(txHash);
        
        if (txStatus.status === "SUCCESS") {
            console.log("[Soroban RPC] Transaction success!");
            return {
                status: "SUCCESS",
                hash: txHash,
                result: txStatus.resultMetaXdr
            };
        } else if (txStatus.status === "FAILED") {
            throw new Error(`Transaction failed on-chain: ${txStatus.resultXdr}`);
        }
        attempts++;
    }
    throw new Error("Transaction confirmation timed out. Please check Stellar Expert Explorer.");
}

// ── Smart Contract Functions Matching lib.rs ────────────────────────────

/**
 * 1. mint(to: Address, token_id: u64, metadata: BytesN<32>, name: String)
 */
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

/**
 * 2. transfer(from: Address, to: Address, token_id: u64)
 */
async function transfer(from, to, token_id) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const args = [
        window.StellarSdk.Address.fromString(from).toScVal(),
        window.StellarSdk.Address.fromString(to).toScVal(),
        window.StellarSdk.nativeToScVal(token_id, { type: "u64" })
    ];
    return await executeContractTransaction("transfer", args);
}

/**
 * 3. burn(owner: Address, token_id: u64)
 */
async function burn(owner, token_id) {
    if (!window.StellarSdk) throw new Error("Stellar SDK not loaded.");
    const args = [
        window.StellarSdk.Address.fromString(owner).toScVal(),
        window.StellarSdk.nativeToScVal(token_id, { type: "u64" })
    ];
    return await executeContractTransaction("burn", args);
}

/**
 * 4. get_nft(token_id: u64)
 */
async function get_nft(token_id) {
    if (!window.StellarSdk) return null;
    try {
        const args = [window.StellarSdk.nativeToScVal(token_id, { type: "u64" })];
        const resultVal = await simulateContractCall("get_nft", args);
        if (resultVal) {
            const native = window.StellarSdk.scValToNative(resultVal);
            return {
                status: "SUCCESS",
                token_id: Number(native.token_id),
                owner: native.owner,
                name: native.name,
                metadata: bytesToHex(native.metadata)
            };
        }
    } catch (e) {
        console.error("get_nft contract call failed:", e);
    }
    return null;
}

/**
 * 5. get_owner(token_id: u64)
 */
async function get_owner(token_id) {
    if (!window.StellarSdk) return null;
    try {
        const args = [window.StellarSdk.nativeToScVal(token_id, { type: "u64" })];
        const resultVal = await simulateContractCall("get_owner", args);
        if (resultVal) {
            return window.StellarSdk.scValToNative(resultVal);
        }
    } catch (e) {
        console.error("get_owner contract call failed:", e);
    }
    return null;
}

/**
 * 6. total_supply()
 */
async function total_supply() {
    if (!window.StellarSdk) return 0;
    try {
        const resultVal = await simulateContractCall("total_supply");
        if (resultVal) {
            return Number(window.StellarSdk.scValToNative(resultVal));
        }
    } catch (e) {
        console.error("total_supply contract call failed:", e);
    }
    return 0;
}

const SorobanIntegration = {
    connectFreighterWallet,
    checkWalletConnection,
    mint,
    transfer,
    burn,
    get_nft,
    get_owner,
    total_supply,
    CONTRACT_ID
};

if (typeof window !== "undefined") {
    window.SorobanIntegration = SorobanIntegration;
}
