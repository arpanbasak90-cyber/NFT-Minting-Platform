/**
 * StellarMint – NFT Minting Platform
 * Full dashboard app with multi-wallet support and network selection
 */

// ── App State ────────────────────────────────────────────────────────
let walletAddress = null;
let walletType = null;
let activeNetwork = 'testnet';
let contractId = 'CDVCJKX6FJFOOQ76BJ365SJS6OTGH2ZQF6QVJO5YGGR37QBJ3I2QB7PZ';
let stats = { minted: 0, transfers: 0, burned: 0 };

// Seed some demo NFTs
const nftStorage = new Map([
    [1, { owner: 'GBK7DEMOADDR4LPO', token_id: 1, metadata: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', name: 'Genesis NFT' }],
    [2, { owner: 'GA65DEMOADDR2RTY', token_id: 2, metadata: 'ca35da0a8939c365bcfda8939c148b267bcfda855e3b0c44298fc1c149afb924', name: 'Soroban Badge' }],
]);

const txHistory = [];

// ── DOM Refs ─────────────────────────────────────────────────────────
const connectWalletBtn  = document.getElementById('connectWalletBtn');
const walletStatusText  = document.getElementById('walletStatusText');
const disconnectBtn     = document.getElementById('disconnectBtn');
const walletModal       = document.getElementById('walletModal');
const closeModalBtn     = document.getElementById('closeModalBtn');
const networkSelector   = document.getElementById('networkSelector');
const networkDropdown   = document.getElementById('networkDropdown');
const networkLabel      = document.getElementById('networkLabel');
const networkChevron    = document.getElementById('networkChevron');
const lobstrForm        = document.getElementById('lobstrForm');
const submitKeyAuthBtn  = document.getElementById('submitKeyAuthBtn');

// ── Init ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    stats.minted = nftStorage.size;
    updateStats();
    updateSupply();

    // Seed random metadata
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    document.getElementById('nftMetadata').value = randomHex;

    addLog('Platform initialized. Connect a wallet to begin minting.', 'info');
});

// ── Page Navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        const page = tab.dataset.page;
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`page-${page}`)?.classList.add('active');
    });
});

// ── Network Selector ──────────────────────────────────────────────────
networkSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    networkDropdown.classList.toggle('hidden');
    networkChevron.classList.toggle('open');
});

document.addEventListener('click', () => {
    networkDropdown.classList.add('hidden');
    networkChevron.classList.remove('open');
});

document.querySelectorAll('.network-opt').forEach(opt => {
    opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const net = opt.dataset.net;
        setNetwork(net);
        networkDropdown.classList.add('hidden');
        networkChevron.classList.remove('open');
    });
});

function setNetwork(net) {
    activeNetwork = net;
    networkLabel.textContent = net.charAt(0).toUpperCase() + net.slice(1);

    // Update dot color
    const dot = document.querySelector('.network-current .network-dot');
    dot.className = `network-dot ${net}`;

    // Update active state
    document.querySelectorAll('.network-opt').forEach(o => {
        o.classList.toggle('active', o.dataset.net === net);
    });

    // Update analytics page
    document.getElementById('anNetwork').textContent = net.charAt(0).toUpperCase() + net.slice(1);

    // Update settings buttons
    document.querySelectorAll('.net-choice').forEach(b => {
        b.classList.toggle('active', b.dataset.net === net);
    });

    showToast(`Switched to ${net.charAt(0).toUpperCase() + net.slice(1)}`, 'info');
    addLog(`Network changed to ${net}`, 'info');
}

// Settings network selector
function selectNetwork(btn, net) {
    setNetwork(net);
}

// Settings contract save
function applyContractSettings() {
    const val = document.getElementById('settingsContractId').value.trim();
    if (val) {
        contractId = val;
        document.getElementById('contractIdText').textContent = val;
        showToast('Contract address updated!', 'success');
    }
}

// ── Wallet Connection ─────────────────────────────────────────────────
connectWalletBtn.addEventListener('click', () => {
    walletModal.classList.remove('hidden');
    lobstrForm.classList.add('hidden');
});

closeModalBtn.addEventListener('click', () => {
    walletModal.classList.add('hidden');
});

walletModal.addEventListener('click', (e) => {
    if (e.target === walletModal) walletModal.classList.add('hidden');
});

document.querySelectorAll('.wallet-row').forEach(row => {
    row.addEventListener('click', async () => {
        const type = row.dataset.wallet;

        if (type === 'lobstr') {
            lobstrForm.classList.toggle('hidden');
            return;
        }

        walletModal.classList.add('hidden');

        if (type === 'freighter') {
            if (typeof window.freighterApi !== 'undefined') {
                try {
                    const pk = await window.freighterApi.getPublicKey();
                    setConnected(pk, 'Freighter');
                } catch (err) {
                    promptPassword('Freighter');
                }
            } else {
                promptPassword('Freighter');
            }
        } else if (type === 'albedo') {
            if (typeof window.albedo !== 'undefined') {
                try {
                    const res = await window.albedo.publicKey({});
                    setConnected(res.pubkey, 'Albedo');
                } catch (err) {
                    promptPassword('Albedo');
                }
            } else {
                promptPassword('Albedo');
            }
        } else if (type === 'xbull') {
            if (typeof window.xBullSDK !== 'undefined') {
                try {
                    const pk = await window.xBullSDK.getPublicKey();
                    setConnected(pk, 'xBull');
                } catch (err) {
                    promptPassword('xBull');
                }
            } else {
                promptPassword('xBull');
            }
        }
    });
});

// LOBSTR manual key auth
submitKeyAuthBtn.addEventListener('click', () => {
    const pk   = document.getElementById('stellarPublicKey').value.trim();
    const pass = document.getElementById('walletPassword').value.trim();

    if (!pk.startsWith('G') || pk.length < 50) {
        showToast('Invalid Stellar public key', 'error'); return;
    }
    if (pass.length < 4) {
        showToast('Password must be at least 4 characters', 'error'); return;
    }

    walletModal.classList.add('hidden');
    setConnected(pk, 'LOBSTR');
    document.getElementById('stellarPublicKey').value = '';
    document.getElementById('walletPassword').value = '';
});

disconnectBtn.addEventListener('click', () => {
    walletAddress = null;
    walletType = null;
    walletStatusText.textContent = 'Connect Wallet';
    connectWalletBtn.classList.remove('connected');
    disconnectBtn.classList.add('hidden');
    document.getElementById('statWallet').textContent = 'Not Connected';
    showToast('Wallet disconnected', 'info');
    addLog('Wallet disconnected.', 'info');
});

function setConnected(pk, type) {
    walletAddress = pk;
    walletType = type;
    const short = `${pk.substring(0, 4)}...${pk.substring(pk.length - 4)}`;
    walletStatusText.textContent = `${type}: ${short}`;
    connectWalletBtn.classList.add('connected');
    disconnectBtn.classList.remove('hidden');
    document.getElementById('statWallet').textContent = short;
    showToast(`Connected to ${type}!`, 'success');
    addLog(`Wallet connected via ${type}: ${pk}`, 'success');
}

function promptPassword(type) {
    const pass = prompt(`🔐 Enter a password to simulate connecting your ${type} wallet:`);
    if (pass === null) { showToast(`${type} connection cancelled`, 'info'); return; }
    if (!pass.trim()) { showToast('Password cannot be empty', 'error'); return; }
    const simAddr = `G${type.toUpperCase()}SIMULATEDDEMOKEYSTELLAR365SJS`;
    setConnected(simAddr, type);
}

// ── Mint NFT ──────────────────────────────────────────────────────────
document.getElementById('mintForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!walletAddress) { showToast('Connect a wallet first', 'error'); return; }

    const name = document.getElementById('nftName').value.trim();
    const id   = parseInt(document.getElementById('tokenId').value);
    const meta = document.getElementById('nftMetadata').value.trim();

    if (nftStorage.has(id)) {
        showToast(`Token ID #${id} already exists!`, 'error'); return;
    }

    nftStorage.set(id, { owner: walletAddress, token_id: id, metadata: meta, name });
    stats.minted++;
    updateStats(); updateSupply();

    const msg = `Minted "${name}" (#${id})`;
    document.getElementById('latestNftText').textContent = `"${name}" (#${id})`;
    showToast(msg, 'success');
    addLog(msg, 'success');
    recordTx('Mint', id, `To: ${walletAddress.substring(0, 8)}...`);
    e.target.reset();
    document.getElementById('nftMetadata').value = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
});

// ── Transfer NFT ──────────────────────────────────────────────────────
document.getElementById('transferForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!walletAddress) { showToast('Connect a wallet first', 'error'); return; }

    const id  = parseInt(document.getElementById('transferTokenId').value);
    const to  = document.getElementById('receiverAddress').value.trim();

    if (!nftStorage.has(id)) { showToast(`NFT #${id} not found`, 'error'); return; }

    const nft = nftStorage.get(id);
    if (nft.owner !== walletAddress && !walletAddress.includes('SIMULATED') && !walletAddress.includes('DEMO')) {
        showToast('You are not the owner of this NFT', 'error'); return;
    }

    nft.owner = to;
    nftStorage.set(id, nft);
    stats.transfers++;
    updateStats();

    const msg = `Transferred #${id} to ${to.substring(0, 8)}...`;
    showToast(msg, 'success');
    addLog(msg, 'success');
    recordTx('Transfer', id, `To: ${to.substring(0, 8)}...`);
    e.target.reset();
});

// ── Burn NFT ──────────────────────────────────────────────────────────
document.getElementById('burnForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!walletAddress) { showToast('Connect a wallet first', 'error'); return; }

    const id = parseInt(document.getElementById('burnTokenId').value);
    if (!nftStorage.has(id)) { showToast(`NFT #${id} not found`, 'error'); return; }

    nftStorage.delete(id);
    stats.burned++;
    updateStats(); updateSupply();

    const msg = `Burned NFT #${id}`;
    showToast(msg, 'success');
    addLog(msg, 'success');
    recordTx('Burn', id, 'Destroyed');
    e.target.reset();
});

// ── Query NFT ─────────────────────────────────────────────────────────
document.getElementById('queryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id  = parseInt(document.getElementById('queryTokenId').value);
    const res = document.getElementById('queryResult');

    if (!nftStorage.has(id)) {
        showToast(`NFT #${id} not found`, 'error');
        res.classList.add('hidden'); return;
    }

    const nft = nftStorage.get(id);
    document.getElementById('resName').textContent  = nft.name;
    document.getElementById('resId').textContent    = `#${nft.token_id}`;
    document.getElementById('resOwner').textContent = nft.owner;
    document.getElementById('resMeta').textContent  = nft.metadata;
    res.classList.remove('hidden');
    showToast(`Fetched NFT #${id}`, 'success');
});

// ── Helpers ───────────────────────────────────────────────────────────
function updateStats() {
    document.getElementById('statMinted').textContent    = stats.minted;
    document.getElementById('statTransfers').textContent = stats.transfers;
    document.getElementById('statBurned').textContent    = stats.burned;
    document.getElementById('anMinted').textContent      = stats.minted;
    document.getElementById('anTransfers').textContent   = stats.transfers;
    document.getElementById('anBurned').textContent      = stats.burned;
}

function updateSupply() {
    document.getElementById('totalSupplyVal').textContent = nftStorage.size;
}

function addLog(msg, type = 'info') {
    const feed = document.getElementById('logsFeed');
    const empty = feed.querySelector('.empty-state');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.innerHTML = `<span>${msg}</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
    feed.insertBefore(item, feed.firstChild);
}

function recordTx(type, tokenId, detail) {
    const tbody = document.getElementById('txTableBody');
    const empty = tbody.querySelector('td.empty-state');
    if (empty) empty.closest('tr').remove();

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date().toLocaleTimeString()}</td>
        <td><span class="tx-type ${type.toLowerCase()}">${type}</span></td>
        <td>#${tokenId}</td>
        <td>${detail}</td>
        <td><span class="tx-status">✅ Success</span></td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const icon  = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
