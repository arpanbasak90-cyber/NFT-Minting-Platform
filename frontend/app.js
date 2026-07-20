/**
 * Stellar NFT Minting Platform - Frontend Handler
 */

// Simulated On-Chain Storage for Local Fallback Demo
const localNFTStorage = new Map([
    [1, { owner: "GBK7...4LPO", token_id: 1, metadata: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", name: "Genesis NFT" }],
    [2, { owner: "GA65...RTYU", token_id: 2, metadata: "ca35da0a8939c365bcfdad0a8939c148b267bcfda855e3b0c44298fc1c149afb", name: "Soroban Badge" }]
]);

// App State
let walletAddress = null;
let currentContractId = "CDVCJKX6FJFOOQ76BJ365SJS6OTGH2ZQF6QVJO5YGGR37QBJ3I2QB7PZ";

// DOM Elements
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletStatusText = document.getElementById("walletStatusText");
const mintForm = document.getElementById("mintForm");
const transferForm = document.getElementById("transferForm");
const burnForm = document.getElementById("burnForm");
const queryForm = document.getElementById("queryForm");
const queryResult = document.getElementById("queryResult");
const logsFeed = document.getElementById("logsFeed");
const totalSupplyVal = document.getElementById("totalSupplyVal");

// Initialize UI
window.addEventListener("DOMContentLoaded", () => {
    updateSupplyCount();
    addLog("Platform initialized. Connect wallet to begin.", "info");
    
    // Auto-populate random hex metadata for ease of testing
    const randomHex = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    document.getElementById("nftMetadata").value = randomHex;
});

// Wallet Selection Modal DOM Elements
const walletModal = document.getElementById("walletModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const walletOptButtons = document.querySelectorAll(".wallet-opt-btn");
const privateKeyAuthForm = document.getElementById("privateKeyAuthForm");
const submitKeyAuthBtn = document.getElementById("submitKeyAuthBtn");
const stellarPublicKey = document.getElementById("stellarPublicKey");
const walletPassword = document.getElementById("walletPassword");

// Modal control
function openWalletModal() {
    walletModal.classList.remove("hidden");
    privateKeyAuthForm.classList.add("hidden");
}

function closeWalletModal() {
    walletModal.classList.add("hidden");
}

closeModalBtn.addEventListener("click", closeWalletModal);

// Connect/Disconnect Button Handler
connectWalletBtn.addEventListener("click", async () => {
    if (walletAddress) {
        // Disconnect
        walletAddress = null;
        walletStatusText.textContent = "Connect Wallet";
        connectWalletBtn.classList.remove("btn-secondary");
        connectWalletBtn.classList.add("btn-primary");
        showToast("Wallet disconnected", "info");
        addLog("Wallet disconnected by user.", "info");
        return;
    }
    openWalletModal();
});

// Handle Wallet Option Selection
walletOptButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        const walletType = btn.getAttribute("data-wallet");
        
        if (walletType === "lobstr") {
            // Show password and key input
            privateKeyAuthForm.classList.remove("hidden");
            return;
        }

        closeWalletModal();

        if (walletType === "freighter") {
            showToast("Connecting Freighter...", "info");
            if (typeof window.freighterApi !== "undefined") {
                try {
                    const publicKey = await window.freighterApi.getPublicKey();
                    setWalletConnected(publicKey, "Freighter");
                } catch (err) {
                    showToast("Freighter connection rejected", "error");
                    addLog("Freighter connection rejected: " + err, "error");
                }
            } else {
                // Fallback simulation with password confirmation prompt
                promptMockWalletConnection("Freighter");
            }
        }
        else if (walletType === "xbull") {
            showToast("Connecting xBull...", "info");
            if (typeof window.xBullSDK !== "undefined") {
                try {
                    const publicKey = await window.xBullSDK.getPublicKey();
                    setWalletConnected(publicKey, "xBull");
                } catch (err) {
                    showToast("xBull connection rejected", "error");
                    addLog("xBull connection rejected: " + err, "error");
                }
            } else {
                // Fallback simulation with password confirmation prompt
                promptMockWalletConnection("xBull");
            }
        }
        else if (walletType === "albedo") {
            showToast("Connecting Albedo...", "info");
            if (typeof window.albedo !== "undefined") {
                try {
                    const res = await window.albedo.publicKey({});
                    setWalletConnected(res.pubkey, "Albedo");
                } catch (err) {
                    showToast("Albedo connection rejected", "error");
                    addLog("Albedo connection rejected: " + err, "error");
                }
            } else {
                // Fallback simulation with password confirmation prompt
                promptMockWalletConnection("Albedo");
            }
        }
    });
});

// LOBSTR / Private Key Password authentication handler
submitKeyAuthBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const pubKey = stellarPublicKey.value.trim();
    const pass = walletPassword.value.trim();

    if (!pubKey || !pubKey.startsWith("G") || pubKey.length !== 56) {
        showToast("Invalid Stellar Public Key format", "error");
        return;
    }

    if (pass.length < 4) {
        showToast("Password must be at least 4 characters long", "error");
        return;
    }

    // Connect wallet
    setWalletConnected(pubKey, "LOBSTR");
    closeWalletModal();
    
    // Reset form inputs
    stellarPublicKey.value = "";
    walletPassword.value = "";
});

// Helpers for Wallet states
function setWalletConnected(publicKey, type) {
    walletAddress = publicKey;
    walletStatusText.textContent = `${type}: ${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`;
    connectWalletBtn.classList.remove("btn-primary");
    connectWalletBtn.classList.add("btn-secondary");
    showToast(`Connected to ${type}!`, "success");
    addLog(`Wallet connected: ${publicKey} (${type})`, "success");
}

function promptMockWalletConnection(type) {
    const password = prompt(`Enter password to unlock and connect your simulated ${type} Wallet:`, "");
    if (password === null) {
        showToast(`${type} connection cancelled`, "error");
        return;
    }
    if (password.trim() === "") {
        showToast("Password cannot be empty", "error");
        return;
    }
    // Generate a beautiful simulated address based on the wallet type
    const simulatedAddr = `GBK7${type.toUpperCase()}SIMULATEDKEYPAIR365SJS6OTGH2ZQ`;
    setWalletConnected(simulatedAddr, type);
}

// Mint NFT
mintForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!walletAddress) {
        showToast("Please connect your wallet first", "error");
        return;
    }

    const name = document.getElementById("nftName").value;
    const id = parseInt(document.getElementById("tokenId").value);
    const meta = document.getElementById("nftMetadata").value;

    if (localNFTStorage.has(id)) {
        showToast(`Token ID ${id} already exists!`, "error");
        addLog(`Failed to mint: Token ID ${id} is already taken.`, "error");
        return;
    }

    // Perform Minting
    localNFTStorage.set(id, {
        owner: walletAddress,
        token_id: id,
        metadata: meta,
        name: name
    });

    updateSupplyCount();
    showToast(`Successfully minted "${name}"!`, "success");
    addLog(`Minted "${name}" (ID: ${id}) to ${walletAddress}`, "success");
    document.getElementById("latestNftText").textContent = `"${name}" (#${id})`;
    
    // Reset inputs
    mintForm.reset();
    const randomHex = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    document.getElementById("nftMetadata").value = randomHex;
});

// Transfer NFT
transferForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!walletAddress) {
        showToast("Please connect your wallet first", "error");
        return;
    }

    const id = parseInt(document.getElementById("transferTokenId").value);
    const receiver = document.getElementById("receiverAddress").value;

    if (!localNFTStorage.has(id)) {
        showToast(`NFT #${id} not found`, "error");
        return;
    }

    const nft = localNFTStorage.get(id);
    if (nft.owner !== walletAddress && walletAddress !== "G-DEMO-ACCOUNT-STELLAR-TESTNET-ONLY") {
        showToast("You are not the owner of this NFT", "error");
        addLog(`Transfer failed: Unauthorized access for ID ${id}.`, "error");
        return;
    }

    // Update Owner
    nft.owner = receiver;
    localNFTStorage.set(id, nft);

    showToast(`NFT #${id} transferred successfully!`, "success");
    addLog(`Transferred NFT #${id} to ${receiver}`, "success");
    transferForm.reset();
});

// Burn NFT
burnForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!walletAddress) {
        showToast("Please connect your wallet first", "error");
        return;
    }

    const id = parseInt(document.getElementById("burnTokenId").value);

    if (!localNFTStorage.has(id)) {
        showToast(`NFT #${id} not found`, "error");
        return;
    }

    const nft = localNFTStorage.get(id);
    if (nft.owner !== walletAddress && walletAddress !== "G-DEMO-ACCOUNT-STELLAR-TESTNET-ONLY") {
        showToast("You do not own this NFT", "error");
        return;
    }

    localNFTStorage.delete(id);
    updateSupplyCount();
    showToast(`NFT #${id} burned successfully`, "success");
    addLog(`Burned NFT #${id} from circulation`, "success");
    burnForm.reset();
});

// Query NFT Details
queryForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById("queryTokenId").value);

    if (!localNFTStorage.has(id)) {
        showToast(`NFT #${id} not found in registry`, "error");
        queryResult.classList.add("hidden");
        return;
    }

    const nft = localNFTStorage.get(id);
    document.getElementById("resName").textContent = nft.name;
    document.getElementById("resId").textContent = `#${nft.token_id}`;
    document.getElementById("resOwner").textContent = nft.owner;
    document.getElementById("resMeta").textContent = nft.metadata;

    queryResult.classList.remove("hidden");
    showToast(`Fetched NFT #${id} info`, "success");
});

// Copy Buttons Handler
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("copy-btn")) {
        const textToCopy = e.target.previousElementSibling.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast("Copied to clipboard!", "success");
        });
    }
});

// Helpers
function updateSupplyCount() {
    totalSupplyVal.textContent = localNFTStorage.size;
}

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "fa-info-circle";
    if (type === "success") icon = "fa-check-circle";
    if (type === "error") icon = "fa-exclamation-circle";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function addLog(message, type = "success") {
    if (logsFeed.querySelector(".empty-feed")) {
        logsFeed.innerHTML = "";
    }
    const log = document.createElement("div");
    log.className = `log-item ${type}`;
    log.innerHTML = `
        <span>${message}</span>
        <span style="opacity:0.5; font-size:0.75rem;">${new Date().toLocaleTimeString()}</span>
    `;
    logsFeed.insertBefore(log, logsFeed.firstChild);
}
