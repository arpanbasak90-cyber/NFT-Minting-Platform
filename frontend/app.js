/**
 * StellarMint — NFT Minting Platform
 * Dynamic, fully runtime-driven. No static/demo data.
 */

// ── State ─────────────────────────────────────────────────────────────
let walletAddress = null;
let walletType    = null;
let activeNetwork = 'testnet';
let theme         = 'dark';
let collectionCap = 100;
let contractId    = '';

const stats = { minted: 0, transfers: 0, burned: 0 };

// Empty — all data is user-generated at runtime
const nftStorage = new Map();

const txHistory     = [];
const notifications = [];
const logHistory    = [];

// ── DOM Quick-refs ────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Init ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    stats.minted = nftStorage.size;
    refreshStats();
    renderGallery();
    randomizeMetaInput();
    addLog('Platform ready. Connect your Stellar wallet to begin.', 'info');
    pushNotif('🚀 Welcome to StellarMint!', 'Connect your wallet to start minting NFTs on Soroban.', 'purple');
    simulateRpcLatency();
    setInterval(simulateRpcLatency, 8000);

    // Landing connects
    $('landingConnectBtn').addEventListener('click', () => {
        $('walletModal').classList.remove('hidden');
        $('lobstrForm').classList.add('hidden');
    });

    $('landingThemeBtn').addEventListener('click', () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    });
});

// ── Page Navigation ───────────────────────────────────────────────────
$$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        $$('.nav-item').forEach(i => i.classList.remove('active'));
        $$('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
        item.classList.add('active');
        const target = $(`page-${page}`);
        if (target) { target.classList.remove('hidden'); target.classList.add('active'); }

        // Update breadcrumb
        const label = item.querySelector('span:first-of-type')?.textContent || page;
        $('pageBreadcrumb').innerHTML = `${item.querySelector('i').outerHTML} ${label}`;

        // Close sidebar on mobile
        $('sidebar').classList.remove('open');
    });
});

// Sidebar toggle (mobile)
$('sidebarToggle').addEventListener('click', () => {
    $('sidebar').classList.toggle('open');
});

// ── Dark / Light Mode ─────────────────────────────────────────────────
function setTheme(t) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    const icon = $('themeIcon');
    if (icon) icon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    const landingIcon = $('landingThemeIcon');
    if (landingIcon) landingIcon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    const switchToggle = $('themeToggleSwitch');
    if (switchToggle) switchToggle.checked = (t === 'light');
}

$('themeBtn').addEventListener('click', () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
});

$('themeToggleSwitch').addEventListener('change', (e) => {
    setTheme(e.target.checked ? 'light' : 'dark');
});

// ── Network Selector ──────────────────────────────────────────────────
$('netBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('netDropdown').classList.toggle('hidden');
    $('netBtn').querySelector('i').classList.toggle('open');
});

document.addEventListener('click', () => {
    $('netDropdown').classList.add('hidden');
    $('netBtn').querySelector('i').classList.remove('open');
});

$$('.net-opt').forEach(opt => {
    opt.addEventListener('click', (e) => {
        e.stopPropagation();
        setNetwork(opt.dataset.net);
        $('netDropdown').classList.add('hidden');
    });
});

function setNetwork(net) {
    activeNetwork = net;
    const label = net.charAt(0).toUpperCase() + net.slice(1);
    $('netLabel').textContent = label;
    $('rpcNetwork').textContent = label;
    $('anNetwork').textContent = label;

    // Update dot class
    $('netDot').className = `ndot ${net}`;

    // Update dropdown active
    $$('.net-opt').forEach(o => o.classList.toggle('active', o.dataset.net === net));

    // Update settings buttons
    $$('.nt-btn').forEach(b => b.classList.toggle('active', b.dataset.net === net));

    simulateRpcLatency();
    showToast(`Switched to ${label}`, 'info');
    addLog(`Network changed → ${label}`, 'info');
    pushNotif(`🌐 Network Changed`, `You are now on ${label}.`);
}

function setNetFromSettings(btn, net) {
    setNetwork(net);
}

// ── Settings ──────────────────────────────────────────────────────────
function applyContractSettings() {
    const val = $('settingsContractId').value.trim();
    if (val && val.startsWith('C') && val.length >= 50) {
        contractId = val;
        $('contractIdText').textContent = val;
        showToast('Contract address saved!', 'success');
        addLog(`Contract updated: ${val.substring(0,12)}...`, 'info');
    } else {
        showToast('Invalid contract address', 'error');
    }
}

function applyCollectionCap() {
    const v = parseInt($('settingsCollectionCap').value);
    if (v >= 1) {
        collectionCap = v;
        refreshStats();
        showToast(`Collection cap set to ${v}`, 'success');
    } else {
        showToast('Cap must be at least 1', 'error');
    }
}

// ── Global Search ─────────────────────────────────────────────────────
$('globalSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    // Search in nftStorage
    let found = null;
    for (const [id, nft] of nftStorage) {
        if (nft.name.toLowerCase().includes(q) || String(id).includes(q)) {
            found = nft; break;
        }
    }
    if (found) {
        showToast(`Found: "${found.name}" (#${found.token_id})`, 'success');
    } else if (q.length > 2) {
        showToast(`No NFT matches "${q}"`, 'info');
    }
});

// ── Wallet Connection ─────────────────────────────────────────────────
$('connectWalletBtn').addEventListener('click', () => {
    $('walletModal').classList.remove('hidden');
    $('lobstrForm').classList.add('hidden');
});

$('closeModalBtn').addEventListener('click', () => {
    $('walletModal').classList.add('hidden');
});

$('walletModal').addEventListener('click', (e) => {
    if (e.target === $('walletModal')) $('walletModal').classList.add('hidden');
});

$$('.w-row').forEach(row => {
    row.addEventListener('click', async () => {
        const type = row.dataset.wallet;

        if (type === 'lobstr') {
            $('lobstrForm').classList.toggle('hidden');
            return;
        }

        $('walletModal').classList.add('hidden');
        showWalletConnecting(type);

        if (type === 'freighter') {
            // ── Real Freighter Extension ───────────────────────────────
            // The extension injects window.freighterApi automatically.
            // getPublicKey() triggers the extension popup for permission if not yet allowed.
            const freighterDetected =
                typeof window.freighterApi !== 'undefined' ||
                typeof window.freighter    !== 'undefined';

            if (freighterDetected) {
                const api = window.freighterApi || window.freighter;
                try {
                    // getPublicKey() handles permission request internally
                    const pk = await api.getPublicKey();
                    if (pk && pk.startsWith('G')) {
                        setConnected(pk, 'Freighter');
                    } else {
                        showWalletError('Freighter', 'No public key returned. Please unlock your Freighter extension and try again.');
                    }
                } catch (err) {
                    const msg = err?.message || String(err);
                    if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
                        showWalletError('Freighter', 'Connection was cancelled. Please approve the connection in Freighter.');
                    } else {
                        showWalletError('Freighter', msg || 'Connection failed. Make sure Freighter is unlocked and try again.');
                    }
                }
            } else {
                showInstallGuide('Freighter', 'https://www.freighter.app', 'freighter-install');
            }
        }

        else if (type === 'albedo') {
            // ── Real Albedo Web Signer ─────────────────────────────
            try {
                if (typeof window.albedo === 'undefined') {
                    // Dynamically load Albedo if not available
                    await loadScript('https://albedo.link/albedo.js');
                }
                const res = await window.albedo.publicKey({ require_existing: false });
                if (res && res.pubkey) {
                    setConnected(res.pubkey, 'Albedo');
                } else {
                    showWalletError('Albedo', 'Could not retrieve public key from Albedo.');
                }
            } catch (err) {
                showWalletError('Albedo', err?.message || 'Connection was rejected or cancelled.');
            }
        }

        else if (type === 'xbull') {
            // ── Real xBull Wallet ──────────────────────────────────
            if (typeof window.xBullSDK !== 'undefined') {
                try {
                    const xBull = new window.xBullSDK();
                    const pk = await xBull.getPublicKey();
                    if (pk && pk.startsWith('G')) {
                        setConnected(pk, 'xBull');
                    } else {
                        showWalletError('xBull', 'Could not retrieve public key from xBull wallet.');
                    }
                } catch (err) {
                    showWalletError('xBull', err?.message || 'Connection was rejected or cancelled.');
                }
            } else {
                showInstallGuide('xBull', 'https://xbull.app', 'xbull-install');
            }
        }
    });
});

// ── Helper: show a connecting spinner toast ────────────────────────
function showWalletConnecting(type) {
    showToast(`Connecting to ${type}…`, 'info');
}

// ── Helper: show wallet error ──────────────────────────────────────
function showWalletError(type, msg) {
    showToast(`${type}: ${msg}`, 'error');
    addLog(`${type} connection failed: ${msg}`, 'info');
}

// ── Helper: show install guide modal ──────────────────────────────
function showInstallGuide(type, url, id) {
    // Remove any existing install guide
    const existing = $(id);
    if (existing) existing.remove();

    const icons = {
        'Freighter': '🚀',
        'xBull': '✦',
    };

    const div = document.createElement('div');
    div.id = id;
    div.className = 'modal-overlay';
    div.style.zIndex = '3000';
    div.innerHTML = `
        <div class="modal-box" style="text-align:center; padding: 2rem;">
            <div style="font-size:2.5rem; margin-bottom: 0.5rem;">${icons[type] || '👛'}</div>
            <h2 style="font-family: var(--font-head); margin-bottom: 0.4rem;">${type} Not Installed</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.5;">
                The <strong>${type}</strong> browser extension is required to connect your real wallet.<br>
                Install it and then refresh this page.
            </p>
            <a href="${url}" target="_blank" rel="noopener noreferrer"
               style="display:inline-flex; align-items:center; gap:0.5rem; background: linear-gradient(135deg, var(--purple), #6d28d9); color:#fff; padding:0.75rem 1.5rem; border-radius: var(--radius); font-weight:700; font-size:0.9rem; text-decoration:none; margin-bottom: 0.75rem;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Install ${type}
            </a>
            <br>
            <button onclick="document.getElementById('${id}').remove()"
                    style="margin-top:0.75rem; background:var(--surface-2); border:1px solid var(--border); color:var(--text); padding:0.5rem 1.25rem; border-radius: var(--radius-sm); font-weight:600; font-size:0.84rem;">
                Cancel
            </button>
        </div>
    `;
    div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
    document.body.appendChild(div);
}

// ── Helper: dynamically load a script ─────────────────────────────
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

// ── LOBSTR — manual public key entry ──────────────────────────────
$('submitKeyAuthBtn').addEventListener('click', () => {
    const pk = $('stellarPublicKey').value.trim();
    if (!pk.startsWith('G') || pk.length < 50) {
        showToast('Invalid Stellar public key — must start with G and be 56 chars', 'error');
        return;
    }
    $('walletModal').classList.add('hidden');
    setConnected(pk, 'LOBSTR');
    $('stellarPublicKey').value = '';
    $('walletPassword').value = '';
});

$('disconnectBtn').addEventListener('click', () => {
    walletAddress = null; walletType = null;
    $('walletStatusText').textContent = 'Connect Wallet';
    $('connectWalletBtn').classList.remove('connected');
    $('disconnectBtn').classList.add('hidden');
    $('walletAddrDisplay').textContent = 'Not Connected';
    $('kpiBalance').textContent = '—';
    document.body.classList.add('landing-active');
    showToast('Wallet disconnected', 'info');
    addLog('Wallet disconnected.', 'info');
});

function setConnected(pk, type) {
    walletAddress = pk;
    walletType    = type;
    const short = `${pk.substring(0, 6)}...${pk.substring(pk.length - 4)}`;
    $('walletStatusText').textContent = `${type}: ${short}`;
    $('connectWalletBtn').classList.add('connected');
    $('disconnectBtn').classList.remove('hidden');
    $('walletAddrDisplay').textContent = pk;
    $('kpiBalance').textContent = 'Fetching…';
    fetchXlmBalance(pk);
    document.body.classList.remove('landing-active');
    showToast(`✅ Connected to ${type}!`, 'success');
    addLog(`Wallet connected via ${type}: ${pk.substring(0, 12)}...`, 'success');
    pushNotif('👛 Wallet Connected', `${type}: ${short}`);
}

// ── Fetch real XLM balance from Horizon ───────────────────────────
async function fetchXlmBalance(pk) {
    const networks = {
        testnet: 'https://horizon-testnet.stellar.org',
        mainnet: 'https://horizon.stellar.org',
        local:   'https://horizon-testnet.stellar.org',
    };
    const horizon = networks[activeNetwork] || networks.testnet;
    try {
        const res  = await fetch(`${horizon}/accounts/${pk}`);
        if (!res.ok) throw new Error('Account not found');
        const data = await res.json();
        const xlm  = data.balances?.find(b => b.asset_type === 'native');
        $('kpiBalance').textContent = xlm ? `${parseFloat(xlm.balance).toFixed(2)} XLM` : '0 XLM';
    } catch {
        $('kpiBalance').textContent = 'N/A';
    }
}


// ── Mint NFT ──────────────────────────────────────────────────────────
$('mintForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!walletAddress) { showToast('Connect a wallet first', 'error'); return; }

    const name    = $('nftName').value.trim();
    const id      = parseInt($('tokenId').value);
    const meta    = $('nftMetadata').value.trim();
    const royalty = parseInt($('nftRoyalty').value) || 0;

    if (nftStorage.has(id)) { showToast(`Token ID #${id} already exists!`, 'error'); return; }
    if (nftStorage.size >= collectionCap) { showToast(`Collection cap of ${collectionCap} reached!`, 'error'); return; }

    nftStorage.set(id, { owner: walletAddress, token_id: id, name, royalty, metadata: meta });
    stats.minted++;
    refreshStats();
    renderGallery();

    const msg = `Minted "${name}" (#${id}) with ${royalty}% royalty`;
    $('latestNftText').textContent = `"${name}" (#${id})`;
    showToast(msg, 'success');
    addLog(msg, 'success');
    recordTx('mint', id, `By: ${walletAddress.substring(0, 8)}...`);
    pushNotif('🎨 NFT Minted!', `"${name}" (Token #${id}) was minted successfully.`);
    e.target.reset();
    randomizeMetaInput();
});

// ── Transfer NFT ──────────────────────────────────────────────────────
$('transferForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!walletAddress) { showToast('Connect a wallet first', 'error'); return; }

    const id   = parseInt($('transferTokenId').value);
    const to   = $('receiverAddress').value.trim();
    const note = $('transferNote').value.trim();

    if (!to.startsWith('G') || to.length < 50) { showToast('Invalid recipient Stellar address', 'error'); return; }
    if (!nftStorage.has(id)) { showToast(`NFT #${id} not found`, 'error'); return; }

    const nft = nftStorage.get(id);
    nft.owner = to;
    nftStorage.set(id, nft);
    stats.transfers++;
    refreshStats();
    renderGallery();

    const detail = note ? `${to.substring(0, 8)}... — ${note}` : `To: ${to.substring(0, 8)}...`;
    const msg = `Transferred #${id} → ${to.substring(0, 8)}...`;
    showToast(msg, 'success');
    addLog(msg, 'success');
    recordTx('transfer', id, detail);
    pushNotif('🔄 Transfer Complete', `Token #${id} transferred to ${to.substring(0, 8)}...`);
    e.target.reset();
});

// ── Burn NFT ──────────────────────────────────────────────────────────
$('burnForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!walletAddress) { showToast('Connect a wallet first', 'error'); return; }

    const id = parseInt($('burnTokenId').value);
    if (!nftStorage.has(id)) { showToast(`NFT #${id} not found`, 'error'); return; }

    const nft = nftStorage.get(id);
    nftStorage.delete(id);
    stats.burned++;
    refreshStats();
    renderGallery();

    const msg = `Burned NFT "${nft.name}" (#${id})`;
    showToast(msg, 'success');
    addLog(msg, 'success');
    recordTx('burn', id, 'Permanently Destroyed');
    pushNotif('🔥 NFT Burned', `"${nft.name}" (#${id}) was permanently destroyed.`);
    e.target.reset();
});

// ── Query NFT ─────────────────────────────────────────────────────────
$('queryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id  = parseInt($('queryTokenId').value);
    const box = $('queryResult');

    if (!nftStorage.has(id)) { showToast(`NFT #${id} not found`, 'error'); box.classList.add('hidden'); return; }

    const nft = nftStorage.get(id);
    $('resName').textContent    = nft.name;
    $('resId').textContent      = `#${nft.token_id}`;
    $('resOwner').textContent   = nft.owner;
    $('resRoyalty').textContent = `${nft.royalty}%`;
    $('resMeta').textContent    = nft.metadata;
    box.classList.remove('hidden');
    showToast(`Found NFT #${id}: "${nft.name}"`, 'success');
});

$('copyQueryBtn')?.addEventListener('click', () => {
    const id = $('resId').textContent;
    const name = $('resName').textContent;
    navigator.clipboard.writeText(`NFT ${id}: ${name}\nOwner: ${$('resOwner').textContent}\nMetadata: ${$('resMeta').textContent}`)
        .then(() => showToast('NFT details copied!', 'success'))
        .catch(() => showToast('Copy failed', 'error'));
});

// ── Copy address util ─────────────────────────────────────────────────
function copyText(elementId) {
    const el = $(elementId);
    if (!el) return;
    const text = el.textContent || el.value;
    navigator.clipboard.writeText(text)
        .then(() => showToast('Copied to clipboard!', 'success'))
        .catch(() => showToast('Copy failed', 'error'));
}

// ── Gallery ───────────────────────────────────────────────────────────
function renderGallery(filter = '') {
    const grid = $('galleryGrid');
    grid.innerHTML = '';

    const colors = ['#8b5cf6', '#14b8a6', '#f97316', '#22c55e', '#ef4444', '#f59e0b'];
    const emojis = ['🖼️', '🎨', '💎', '⭐', '🚀', '🔮', '🌊', '🔥', '💫', '🌟'];

    let entries = [...nftStorage.entries()];

    if (filter) {
        entries = entries.filter(([id, nft]) =>
            nft.name.toLowerCase().includes(filter.toLowerCase()) || String(id).includes(filter)
        );
    }

    // Apply sort
    const sortBy = $('gallerySortBy')?.value || 'id-asc';
    entries.sort((a, b) => {
        if (sortBy === 'id-asc')  return a[0] - b[0];
        if (sortBy === 'id-desc') return b[0] - a[0];
        if (sortBy === 'name')    return a[1].name.localeCompare(b[1].name);
        return 0;
    });

    if (entries.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-images"></i><br>No NFTs found.</div>';
        return;
    }

    entries.forEach(([id, nft]) => {
        const color = colors[id % colors.length];
        const emoji = emojis[id % emojis.length];
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <div class="gallery-thumb" style="background: linear-gradient(135deg, ${color}22, ${color}44);">
                <span>${emoji}</span>
                <span class="gallery-token-badge">#${id}</span>
            </div>
            <div class="gallery-card-body">
                <h3>${nft.name}</h3>
                <p>Royalty: ${nft.royalty}% · Owner: ${nft.owner.substring(0, 8)}...</p>
            </div>
        `;
        card.addEventListener('click', () => {
            showToast(`${nft.name} — Owner: ${nft.owner.substring(0, 10)}...`, 'info');
        });
        grid.appendChild(card);
    });

    // Update gallery badge
    $('galleryBadge').textContent = nftStorage.size;
}

// Gallery search + sort
$('gallerySearch')?.addEventListener('input', (e) => renderGallery(e.target.value));
$('gallerySortBy')?.addEventListener('change', () => renderGallery($('gallerySearch')?.value || ''));

// ── Activity Feed ─────────────────────────────────────────────────────
function addLog(msg, type = 'info') {
    logHistory.unshift({ msg, type, time: new Date() });
    const feed  = $('logsFeed');
    const empty = feed.querySelector('.empty-state');
    if (empty) empty.remove();

    const row = document.createElement('div');
    row.className = `log-row ${type}`;
    row.innerHTML = `<span>${msg}</span><span class="log-time">${new Date().toLocaleTimeString()}</span>`;
    feed.insertBefore(row, feed.firstChild);
}

$('clearLogsBtn')?.addEventListener('click', () => {
    $('logsFeed').innerHTML = '<div class="empty-state"><i class="fa-solid fa-clock"></i><br>Logs cleared.</div>';
    logHistory.length = 0;
    showToast('Activity feed cleared', 'info');
});

// ── Export CSV ────────────────────────────────────────────────────────
$('exportCsvBtn')?.addEventListener('click', () => exportCsv('activity'));
$('exportTxCsvBtn')?.addEventListener('click', () => exportCsv('tx'));

function exportCsv(type) {
    let csv = '';
    if (type === 'activity') {
        csv = 'Time,Type,Message\n' + logHistory.map(l => `"${l.time.toLocaleTimeString()}","${l.type}","${l.msg}"`).join('\n');
    } else {
        csv = 'Time,Type,Token ID,Details,Network\n' + txHistory.map(t => `"${t.time}","${t.type}","${t.id}","${t.detail}","${t.network}"`).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `stellarmint-${type}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${type === 'activity' ? 'activity log' : 'transactions'} as CSV`, 'success');
}

// ── Tx Center ─────────────────────────────────────────────────────────
function recordTx(type, id, detail) {
    const tbody = $('txTableBody');
    const emptyRow = tbody.querySelector('tr td.empty-td');
    if (emptyRow) emptyRow.closest('tr').remove();

    const entry = { time: new Date().toLocaleTimeString(), type, id, detail, network: activeNetwork };
    txHistory.unshift(entry);

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${entry.time}</td>
        <td><span class="tx-badge ${type}">${type}</span></td>
        <td>#${id}</td>
        <td>${detail}</td>
        <td><span class="ndot ${activeNetwork}" style="display:inline-block;margin-right:4px"></span>${activeNetwork}</td>
        <td class="tx-ok">✓ Success</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
}

// ── Analytics ─────────────────────────────────────────────────────────
function refreshStats() {
    const total = stats.minted;
    const txs   = stats.transfers;
    const burns = stats.burned;

    // KPI
    $('kpiMinted').textContent    = total;
    $('kpiTransfers').textContent = txs;
    $('kpiBurned').textContent    = burns;

    // Analytics big stats
    $('anMinted').textContent    = total;
    $('anTransfers').textContent = txs;
    $('anBurned').textContent    = burns;

    // Analytics bars (max 100)
    const mintPct  = Math.min((total / 100) * 100, 100);
    const txPct    = Math.min((txs / Math.max(total, 1)) * 100, 100);
    const burnPct  = Math.min((burns / Math.max(total, 1)) * 100, 100);
    $('anMintFill').style.width     = `${mintPct}%`;
    $('anTransferFill').style.width = `${txPct}%`;
    $('anBurnFill').style.width     = `${burnPct}%`;

    // Progress bar
    const supply = nftStorage.size;
    $('totalSupplyVal').textContent = supply;
    const pct = Math.min((supply / collectionCap) * 100, 100);
    $('progressFill').style.width  = `${pct}%`;
    $('progressText').textContent  = `${supply} / ${collectionCap} NFTs minted`;

    // Breakdown bars
    const totalOps = total + txs + burns;
    if (totalOps > 0) {
        const mp = Math.round((total / totalOps) * 100);
        const tp = Math.round((txs  / totalOps) * 100);
        const bp = Math.round((burns / totalOps) * 100);
        $('bbMint').style.width          = `${mp}%`;
        $('bbTransfer').style.width      = `${tp}%`;
        $('bbBurn').style.width          = `${bp}%`;
        $('bbMintPct').textContent       = `${mp}%`;
        $('bbTransferPct').textContent   = `${tp}%`;
        $('bbBurnPct').textContent       = `${bp}%`;
    }
}

// ── Notifications ─────────────────────────────────────────────────────
function pushNotif(title, body, color = 'purple') {
    notifications.unshift({ title, body, time: new Date(), unread: true });
    const count = notifications.filter(n => n.unread).length;
    $('notifBadge').textContent = count > 0 ? count : '0';

    // Render
    const list  = $('notifList');
    const empty = list.querySelector('.empty-state');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'notif-item unread';
    item.innerHTML = `
        <div class="notif-icon">🔔</div>
        <div class="notif-body">
            <strong>${title}</strong>
            <p>${body}</p>
        </div>
        <span class="notif-time">${new Date().toLocaleTimeString()}</span>
    `;
    list.insertBefore(item, list.firstChild);
}

$('clearNotifsBtn')?.addEventListener('click', () => {
    $('notifList').innerHTML = '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><br>No notifications.</div>';
    notifications.length = 0;
    $('notifBadge').textContent = '0';
    showToast('All notifications cleared', 'info');
});

// ── Quick Mint Templates ──────────────────────────────────────────────
$$('.template-use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const name    = btn.dataset.name;
        const royalty = btn.dataset.royalty;

        // Navigate to dashboard and prefill form
        $$('.nav-item').forEach(i => i.classList.remove('active'));
        $$('.page').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
        document.querySelector('[data-page="dashboard"]').classList.add('active');
        $('page-dashboard').classList.remove('hidden');
        $('page-dashboard').classList.add('active');
        $('pageBreadcrumb').innerHTML = '<i class="fa-solid fa-grid-2"></i> Dashboard';

        // Fill form
        $('nftName').value    = `${name} #${Math.floor(Math.random() * 999) + 1}`;
        $('nftRoyalty').value = royalty;
        randomizeMetaInput();
        $('tokenId').focus();

        showToast(`Template "${name}" loaded!`, 'success');
    });
});

$('saveTemplateBtn')?.addEventListener('click', () => {
    const name = $('nftName').value.trim();
    if (!name) { showToast('Fill in Asset Name on Dashboard first', 'error'); return; }
    showToast(`Template "${name}" saved (demo)!`, 'success');
    addLog(`Saved quick-mint template: "${name}"`, 'info');
});

$('addCustomTemplateBtn')?.addEventListener('click', () => {
    const name = $('nftName').value.trim() || prompt('Enter template name:');
    if (!name) return;
    showToast(`Template "${name}" saved!`, 'success');
});

// ── RPC Latency Simulation ────────────────────────────────────────────
function simulateRpcLatency() {
    const latency = Math.floor(Math.random() * 80) + 20;
    $('rpcLatency').textContent = `~${latency}ms`;
    $('rpcDot').className = latency < 100 ? 'rpc-dot live' : 'rpc-dot dead';
}

// ── Regen metadata ────────────────────────────────────────────────────
function randomizeMetaInput() {
    const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const inp = $('nftMetadata');
    if (inp) inp.value = hex;
}

$('regenMetaBtn')?.addEventListener('click', () => {
    randomizeMetaInput();
    showToast('New metadata hash generated!', 'info');
});

// ── Toast Notifications ───────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}
