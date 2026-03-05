let currentSubject = 'geometry';
let currentTest = 'module1';
let currentQuestionIndex = 0;
let score = 0;
let activeRefTab = 'geometry';
const SINGLE_SESSION_PRICE = 500;
const BUNDLE_SIZE = 10;
const BUNDLE_PRICE = 4500;
const BILLING_LOGS_FILE = 'billing-logs.csv';
const BILLING_TABLE = 'billing_sessions';
const BILLING_PASSWORD = 'climb123'; // Change this value to update billing access password.
const BILLING_STORAGE_KEY = 'billingSessionsStateV1';
const BILLING_STORAGE_VERSION_KEY = 'billingSessionsStateVersionV1';
const BILLING_STORAGE_VERSION = '2026-03-05-supabase-bundle-pricing';
let billingUnlocked = sessionStorage.getItem('billingUnlocked') === '1';
let billingSessions = [];
let supabaseClient = null;
let billingPersistenceMode = 'local';

const BILLING_SESSION_CSV = `date,time,tutee,sessions,status
2025-09-02,18:00,JC,1,Paid
2025-09-05,18:00,JC,1,Paid
2025-09-08,18:00,JC,1,Paid
2025-09-11,18:00,JC,1,Paid
2025-09-14,18:00,JC,1,Paid
2025-09-17,18:00,JC,1,Paid
2025-09-20,18:00,JC,1,Paid
2025-09-23,18:00,JC,1,Paid
2025-09-26,18:00,JC,1,Paid
2025-09-29,18:00,JC,1,Paid
2025-10-02,18:00,JC,1,Paid
2025-10-05,18:00,JC,1,Paid
2025-10-08,18:00,JC,1,Paid
2025-10-11,18:00,JC,1,Paid
2025-10-14,18:00,JC,1,Paid
2025-10-17,18:00,JC,1,Paid
2025-10-20,18:00,JC,1,Paid
2025-10-23,18:00,JC,1,Paid
2025-10-26,18:00,JC,1,Paid
2025-10-29,18:00,JC,1,Paid
2025-11-01,18:00,JC,1,Paid
2025-11-04,18:00,JC,1,Paid
2025-11-07,18:00,JC,1,Paid
2025-11-10,18:00,JC,1,Paid
2025-11-13,18:00,JC,1,Paid
2025-11-16,18:00,JC,1,Paid
2025-11-19,18:00,JC,1,Paid
2025-11-22,18:00,JC,1,Paid
2025-11-25,18:00,JC,1,Paid
2025-11-28,18:00,JC,1,Paid
2025-12-01,18:00,JC,1,Paid
2025-12-04,18:00,JC,1,Paid
2025-12-07,18:00,JC,1,Paid
2025-12-10,18:00,JC,1,Paid
2025-12-13,18:00,JC,1,Paid
2025-12-16,18:00,JC,1,Unpaid
2025-12-19,18:00,JC,1,Unpaid
2025-12-22,18:00,JC,1,Unpaid
2025-12-25,18:00,JC,1,Paid
2025-12-28,18:00,JC,1,Unpaid
2025-12-31,18:00,JC,1,Paid
2026-01-03,18:00,JC,1,Unpaid
2026-01-06,18:00,JC,1,Unpaid
2026-01-09,18:00,JC,1,Unpaid
2026-01-12,18:00,JC,1,Paid
2026-01-15,18:00,JC,1,Unpaid
2026-01-18,18:00,JC,1,Unpaid
2026-01-21,18:00,JC,1,Unpaid
2026-01-24,18:00,JC,1,Unpaid
2026-01-27,18:00,JC,1,Paid
2026-01-30,18:00,JC,1,Unpaid
2026-02-02,18:00,JC,1,Unpaid
2026-02-05,18:00,JC,1,Unpaid
2026-02-08,18:00,JC,1,Paid
2026-02-11,18:00,JC,1,Unpaid
2026-02-14,18:00,JC,1,Unpaid
2026-02-17,18:00,JC,1,Unpaid
2026-02-20,18:00,JC,1,Unpaid
2026-02-23,18:00,JC,1,Unpaid
2026-02-26,18:00,JC,1,Unpaid
2026-03-01,18:00,JC,1,Unpaid
2026-03-04,18:00,JC,1,Unpaid`;

// Theme Logic
// 1. Check LocalStorage
// 2. Fallback to System Preference
const getPreferredTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const savedTheme = getPreferredTheme();
document.documentElement.setAttribute('data-theme', savedTheme);

function getSupabaseConfig() {
    const config = window.SUPABASE_CONFIG || {};
    const url = (config.url || '').trim();
    const anonKey = (config.anonKey || '').trim();
    const hasValidUrl = url && !url.includes('YOUR-PROJECT') && !url.includes('your-project');
    const hasValidAnon = anonKey && !anonKey.includes('YOUR-ANON-KEY') && !anonKey.includes('your-anon-key');
    if (!hasValidUrl || !hasValidAnon) {
        return null;
    }
    return { url, anonKey };
}

function initSupabaseClient() {
    const cfg = getSupabaseConfig();
    if (!cfg || !window.supabase || typeof window.supabase.createClient !== 'function') {
        billingPersistenceMode = 'local';
        return;
    }
    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
    billingPersistenceMode = 'supabase';
}

function hasSupabaseBilling() {
    return !!supabaseClient;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Script loaded successfully");
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    initSupabaseClient();
    initPaymentCountSelector();
    await loadBillingSessions();
    renderBillingDashboard();
});

window.toggleTheme = function () {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);

    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = next === 'light' ? '🌙' : '☀️';
}

function parseBillingSessionsCSV(data) {
    if (!data) return [];
    const lines = data.trim().split('\n').slice(1);
    return lines.map((line, idx) => {
        const [date, time, tutee, sessions, status] = line.split(',');
        return normalizeBillingRow({
            date,
            time,
            tutee,
            sessions,
            status
        }, idx);
    }).filter(item => item.date && item.time && item.tutee);
}

function initPaymentCountSelector() {
    const select = document.getElementById('billing-pay-count');
    if (!select) return;
    select.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = String(i);
        option.textContent = `${i} session${i === 1 ? '' : 's'}`;
        select.appendChild(option);
    }
    select.value = '1';
    select.addEventListener('change', () => {
        updateDiscountMeter();
        setBillingPaymentStatus('');
    });
    updateDiscountMeter();
}

async function loadBillingSessions() {
    if (hasSupabaseBilling()) {
        try {
            const remoteRows = await loadBillingSessionsFromSupabase();
            if (remoteRows.length > 0) {
                billingSessions = remoteRows;
                saveBillingSessions();
                return;
            }

            // First run on a fresh database: seed from local CSV fallback.
            const seedRows = await loadBillingSessionsFromFile();
            const initialRows = seedRows.length ? seedRows : parseBillingSessionsCSV(BILLING_SESSION_CSV);
            billingSessions = await seedSupabaseBilling(initialRows);
            saveBillingSessions();
            return;
        } catch (error) {
            console.warn('Supabase billing load failed. Falling back to local storage.', error);
            billingPersistenceMode = 'local';
            supabaseClient = null;
        }
    }

    try {
        const saved = localStorage.getItem(BILLING_STORAGE_KEY);
        const savedVersion = localStorage.getItem(BILLING_STORAGE_VERSION_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (savedVersion === BILLING_STORAGE_VERSION && Array.isArray(parsed) && parsed.every(row => row && row.date && row.time && row.tutee)) {
                billingSessions = parsed.map((row, idx) => normalizeBillingRow(row, idx));
                return;
            }
        }
    } catch (error) {
        console.warn('Failed to load billing sessions from storage. Reverting to CSV seed.', error);
    }
    billingSessions = await loadBillingSessionsFromFile();
    if (!billingSessions.length) {
        billingSessions = parseBillingSessionsCSV(BILLING_SESSION_CSV);
    }
    saveBillingSessions();
}

async function loadBillingSessionsFromSupabase() {
    if (!hasSupabaseBilling()) return [];
    const { data, error } = await supabaseClient
        .from(BILLING_TABLE)
        .select('id,date,time,tutee,sessions,status,sort_order')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .order('sort_order', { ascending: true });
    if (error) throw error;
    if (!Array.isArray(data)) return [];
    return data.map((row, idx) => normalizeBillingRow({
        id: row.id,
        date: row.date,
        time: row.time,
        tutee: row.tutee,
        sessions: row.sessions,
        status: row.status,
        sort_order: row.sort_order
    }, idx));
}

async function seedSupabaseBilling(seedRows) {
    if (!hasSupabaseBilling()) return seedRows;
    const payload = seedRows.map((row, idx) => ({
        date: row.date,
        time: row.time,
        tutee: row.tutee,
        sessions: 1,
        status: row.status,
        sort_order: idx
    }));
    const { data, error } = await supabaseClient
        .from(BILLING_TABLE)
        .insert(payload)
        .select('id,date,time,tutee,sessions,status,sort_order');
    if (error) throw error;
    return (data || []).map((row, idx) => normalizeBillingRow({
        id: row.id,
        date: row.date,
        time: row.time,
        tutee: row.tutee,
        sessions: row.sessions,
        status: row.status,
        sort_order: row.sort_order
    }, idx));
}

async function loadBillingSessionsFromFile() {
    try {
        const response = await fetch(BILLING_LOGS_FILE, { cache: 'no-store' });
        if (!response.ok) return [];
        const csvText = await response.text();
        return parseBillingSessionsCSV(csvText);
    } catch (error) {
        return [];
    }
}

function saveBillingSessions() {
    try {
        localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(billingSessions));
        localStorage.setItem(BILLING_STORAGE_VERSION_KEY, BILLING_STORAGE_VERSION);
    } catch (error) {
        console.warn('Failed to save billing sessions state.', error);
    }
}

function setBillingPaymentStatus(message = '', isError = false) {
    const statusEl = document.getElementById('billing-payment-status');
    if (!statusEl) return;
    if (!message) {
        statusEl.classList.add('hidden');
        statusEl.classList.remove('is-error', 'is-success');
        statusEl.textContent = '';
        return;
    }
    statusEl.classList.remove('hidden');
    statusEl.classList.toggle('is-error', isError);
    statusEl.classList.toggle('is-success', !isError);
    statusEl.textContent = message;
}

function formatPeso(amount) {
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSessionCount(count) {
    return `${count} session${count === 1 ? '' : 's'}`;
}

function normalizeBillingRow(row, index) {
    const parsedOrder = Number(row.sort_order);
    const normalizedTime = (row.time || '').trim().slice(0, 5);
    const normalizedDate = (row.date || '').trim();
    return {
        id: Number.isFinite(Number(row.id)) ? Number(row.id) : null,
        date: normalizedDate,
        time: normalizedTime,
        tutee: (row.tutee || '').trim(),
        // Billing is now strictly tracked per session-log unit for 1-10 payments.
        sessions: 1,
        status: ((row.status || '').trim().toLowerCase() === 'paid') ? 'paid' : 'unpaid',
        order: Number.isFinite(parsedOrder)
            ? parsedOrder
            : (Number.isFinite(Number(row.order)) ? Number(row.order) : index)
    };
}

function calculatePaymentBreakdown(sessionCount) {
    const sanitizedCount = Math.max(0, Math.floor(sessionCount));
    const bundles = Math.floor(sanitizedCount / BUNDLE_SIZE);
    const singles = sanitizedCount % BUNDLE_SIZE;
    const baseTotal = sanitizedCount * SINGLE_SESSION_PRICE;
    const discountedTotal = (bundles * BUNDLE_PRICE) + (singles * SINGLE_SESSION_PRICE);
    return {
        sessionCount: sanitizedCount,
        bundles,
        singles,
        baseTotal,
        discountedTotal,
        discount: Math.max(0, baseTotal - discountedTotal)
    };
}

function updateDiscountMeter() {
    const select = document.getElementById('billing-pay-count');
    const fill = document.getElementById('billing-discount-fill');
    const meterText = document.getElementById('billing-discount-text');
    if (!select || !fill || !meterText) return;

    const selectedCount = Number.parseInt(select.value || '1', 10);
    const breakdown = calculatePaymentBreakdown(selectedCount);
    const progressPct = Math.max(0, Math.min(100, (breakdown.sessionCount / BUNDLE_SIZE) * 100));
    fill.style.width = `${progressPct}%`;

    if (breakdown.sessionCount < BUNDLE_SIZE) {
        const remaining = BUNDLE_SIZE - breakdown.sessionCount;
        meterText.textContent = `Paying now: ${formatPeso(breakdown.discountedTotal)}. Add ${remaining} more to unlock ₱500 bundle discount.`;
        return;
    }

    meterText.textContent = `Bundle unlocked: ${formatPeso(breakdown.discountedTotal)} total. You save ${formatPeso(breakdown.discount)}.`;
}

function setBillingPasswordError(message = '') {
    const error = document.getElementById('billing-password-error');
    if (!error) return;
    if (message) {
        error.textContent = message;
        error.classList.remove('hidden');
    } else {
        error.classList.add('hidden');
    }
}

function getBillingTimestamp(item) {
    const datePart = item.date || '1970-01-01';
    const timePart = item.time || '00:00';
    const parsed = Date.parse(`${datePart}T${timePart}:00`);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function renderBillingList(targetId, sessions, emptyText, sortOrder = 'desc') {
    const list = document.getElementById(targetId);
    if (!list) return;
    list.innerHTML = '';
    list.scrollTop = 0;

    if (!sessions.length) {
        const empty = document.createElement('div');
        empty.className = 'billing-empty';
        empty.textContent = emptyText;
        list.appendChild(empty);
        return;
    }

    const direction = sortOrder === 'asc' ? 1 : -1;
    const sorted = [...sessions].sort((a, b) => {
        const diff = getBillingTimestamp(a) - getBillingTimestamp(b);
        if (diff !== 0) return direction * diff;
        return direction * ((a.order || 0) - (b.order || 0));
    });
    sorted.forEach(item => {
        const amount = item.sessions * SINGLE_SESSION_PRICE;
        const entry = document.createElement('div');
        entry.className = `billing-item ${item.status}`;
        entry.innerHTML = `
            <div class="billing-item-top">
                <span class="billing-item-date">${item.date} ${item.time}</span>
                <span class="billing-status ${item.status}">${item.status.toUpperCase()}</span>
            </div>
            <div class="billing-item-bottom">
                <span>${item.tutee} • ${formatSessionCount(item.sessions)}</span>
                <strong>${formatPeso(amount)}</strong>
            </div>
        `;
        list.appendChild(entry);
    });
}

function renderBillingDashboard() {
    const unpaidSessions = billingSessions.filter(item => item.status === 'unpaid');
    const unpaidTotal = unpaidSessions.reduce((sum, item) => sum + (item.sessions * SINGLE_SESSION_PRICE), 0);

    const totalUnpaidEl = document.getElementById('billing-total-unpaid');
    const unpaidCountEl = document.getElementById('billing-unpaid-count');
    const totalLogsEl = document.getElementById('billing-total-logs');

    if (totalUnpaidEl) totalUnpaidEl.textContent = formatPeso(unpaidTotal);
    if (unpaidCountEl) unpaidCountEl.textContent = String(unpaidSessions.length);
    if (totalLogsEl) totalLogsEl.textContent = String(billingSessions.length);

    renderBillingList('billing-unpaid-list', unpaidSessions, 'No unpaid sessions right now.', 'asc');
    renderBillingList('billing-log-list', billingSessions, 'No session logs found.', 'desc');
    updateDiscountMeter();
}

async function applyBulkPayment() {
    const select = document.getElementById('billing-pay-count');
    const requested = Number.parseInt(select && select.value ? select.value : '1', 10);
    if (!Number.isFinite(requested) || requested < 1 || requested > 10) {
        setBillingPaymentStatus('Select a valid payment count from 1 to 10.', true);
        return;
    }

    const unpaidSorted = billingSessions
        .filter(item => item.status === 'unpaid')
        .sort((a, b) => {
            const diff = getBillingTimestamp(a) - getBillingTimestamp(b);
            if (diff !== 0) return diff;
            return (a.order || 0) - (b.order || 0);
        });

    if (!unpaidSorted.length) {
        setBillingPaymentStatus('No unpaid sessions to mark as paid.', true);
        return;
    }

    const payNow = unpaidSorted.slice(0, requested);
    const idsToUpdate = payNow.map(item => item.id).filter(id => Number.isFinite(Number(id)));
    if (hasSupabaseBilling()) {
        if (idsToUpdate.length !== payNow.length) {
            setBillingPaymentStatus('Sync issue: some billing rows are missing Supabase IDs. Refresh and try again.', true);
            return;
        }
        const { error } = await supabaseClient
            .from(BILLING_TABLE)
            .update({ status: 'paid' })
            .in('id', idsToUpdate);
        if (error) {
            setBillingPaymentStatus(`Supabase update failed: ${error.message}`, true);
            return;
        }
    }

    payNow.forEach(item => {
        item.status = 'paid';
    });
    saveBillingSessions();
    renderBillingDashboard();

    const paidCount = payNow.reduce((sum, item) => sum + item.sessions, 0);
    const breakdown = calculatePaymentBreakdown(paidCount);
    const remaining = billingSessions.filter(item => item.status === 'unpaid').length;
    const discountText = breakdown.discount > 0 ? ` Saved ${formatPeso(breakdown.discount)}.` : '';
    const modeText = billingPersistenceMode === 'supabase' ? 'Synced to Supabase.' : 'Saved locally.';
    setBillingPaymentStatus(`Marked ${formatSessionCount(paidCount)} as PAID (FIFO). Charged ${formatPeso(breakdown.discountedTotal)}.${discountText} ${remaining} unpaid remaining. ${modeText}`);
    updateDiscountMeter();
}

function showBillingPasswordModal() {
    const modal = document.getElementById('billing-password-modal');
    const input = document.getElementById('billing-password-input');
    if (!modal) return;

    setBillingPasswordError('');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    if (input) input.focus();
}

function closeBillingPasswordModal() {
    const modal = document.getElementById('billing-password-modal');
    const input = document.getElementById('billing-password-input');
    if (!modal) return;

    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
    if (input) input.value = '';
    setBillingPasswordError('');
}

function submitBillingPassword() {
    const input = document.getElementById('billing-password-input');
    if (!input) return;

    if (input.value === BILLING_PASSWORD) {
        billingUnlocked = true;
        sessionStorage.setItem('billingUnlocked', '1');
        closeBillingPasswordModal();
        openBilling();
    } else {
        setBillingPasswordError('Incorrect password. Try again.');
        input.focus();
    }
}

function handleBillingPasswordKeydown(event) {
    if (event.key === 'Enter') {
        submitBillingPassword();
    }
}

async function openBilling() {
    if (!billingUnlocked) {
        showBillingPasswordModal();
        return;
    }
    await loadBillingSessions();
    renderBillingDashboard();
    navTo('billing');
}

function renderMath() {
    if (window.renderMathInElement) {
        renderMathInElement(document.body, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\[", right: "\\]", display: true }
            ]
        });
    }
}

// === IMPROVED QUICK REFERENCE ===
function openQuickRef() {
    const modal = document.getElementById('quick-ref-modal');
    modal.classList.add('active');
    // Ensure MathJax renders if not already
    renderMath();
}

function closeQuickRef() {
    const modal = document.getElementById('quick-ref-modal');
    modal.classList.remove('active');
}

// === CORE NAVIGATION ===
function scrollToSection(id) {
    if (document.getElementById('landing').classList.contains('hidden')) {
        navTo('landing');
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
}

function navTo(screenId) {
    // Hide all main sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    // Show target
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    // Close overlays
    document.getElementById('feedback-overlay').classList.remove('active');

    // Scroll handling
    if (screenId === 'landing') {
        window.scrollTo(0, 0);
    }
}

// Subject Selection
function selectSubject(subject) {
    currentSubject = subject;
    const testGrid = document.getElementById('test-grid');
    testGrid.innerHTML = '';

    if (subject === 'linear_functions' || subject === 'line_equation') {
        const titles = {
            'linear_functions': 'Linear Functions',
            'line_equation': 'Equation of a Line & Graphing'
        };
        document.getElementById('subject-title').textContent = titles[subject];

        const emptyState = document.createElement('div');
        emptyState.style.gridColumn = "1 / -1";
        emptyState.style.textAlign = "center";
        emptyState.style.padding = "4rem 2rem";
        emptyState.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚧</div>
            <h3>Module Under Construction</h3>
            <p style="color: var(--text-secondary);">Content for Linear Functions is being prepared. Check back soon!</p>
            <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="navTo('landing')">Return Home</button>
        `;
        testGrid.appendChild(emptyState);
        navTo('test-selection');
        return;
    }

    // Dynamic Title Logic
    const titles = {
        'geometry': 'Parallel & Perpendicular Lines',
        'polynomials': 'Polynomial Functions',
        'circles': 'Circles'
    };
    document.getElementById('subject-title').textContent = titles[subject] || 'Module Selection';

    // Group modules by difficulty
    const rawModules = window.questions[subject] || {};
    const modulesByDiff = {
        'Foundation': [],
        'Intermediate': [],
        'Elite': []
    };

    // Sort valid modules into categories
    Object.keys(rawModules).forEach(key => {
        const mod = rawModules[key];
        const diff = mod.difficulty || 'Foundation'; // Default fallback
        if (!modulesByDiff[diff]) modulesByDiff[diff] = [];

        modulesByDiff[diff].push({
            id: key,
            ...mod
        });
    });

    // Render Categories
    const diffOrder = ['Foundation', 'Intermediate', 'Elite'];

    diffOrder.forEach(diff => {
        const mods = modulesByDiff[diff];
        if (!mods || mods.length === 0) return;

        // Category Header
        const catHeader = document.createElement('div');
        catHeader.style.gridColumn = "1 / -1";
        catHeader.style.marginTop = "2rem";
        catHeader.style.marginBottom = "1rem";

        let desc = "Build your core understanding.";
        if (diff === 'Intermediate') desc = "Apply concepts to standard problems.";
        if (diff === 'Elite') desc = "Complex synthesis and proofs.";

        catHeader.innerHTML = `
            <h3 style="font-size: 1.4rem; color: var(--text-primary); margin-bottom: 0.25rem;">${diff} Level</h3>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">${desc}</p>
            <hr style="border: 0; border-top: 1px solid var(--border); margin-top: 0.5rem;">
        `;
        testGrid.appendChild(catHeader);

        // Modules
        mods.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.padding = '1.5rem';
            const subjectIcons = {
                polynomials: '✖️',
                geometry: '📐',
                circles: '⭕'
            };
            const icon = subjectIcons[subject] || '📘';
            card.innerHTML = `
                <div class="card-icon" style="margin-bottom:1rem; font-size:2.5rem;">${icon}</div>
                <h3 style="font-size:1.1rem;">${mod.title}</h3>
                <p style="margin-bottom: 0.5rem; font-weight:600;">${mod.subtitle}</p>
                <p style="margin-bottom: 1rem; font-size: 0.9rem;">${mod.description}</p>
                <span class="badge" style="margin-top:auto;">Start</span>
            `;
            card.onclick = () => startTest(mod.id);
            testGrid.appendChild(card);
        });
    });

    navTo('test-selection');
}

// Quiz Functions
function startTest(testKey) {
    currentTest = testKey;
    currentQuestionIndex = 0;
    score = 0;
    const subjectLabels = {
        geometry: 'Geometry / Lines',
        polynomials: 'Polynomials',
        circles: 'Geometry / Circles'
    };
    document.getElementById('quiz-subject-label').textContent = subjectLabels[currentSubject] || 'Subject';
    navTo('quiz');
    loadQuestion();
}

function loadQuestion() {
    try {
        document.getElementById('feedback-overlay').classList.remove('active');

        // Ensure data exists or throw error
        if (!window.questions || !window.questions[currentSubject]) {
            throw new Error(`Data missing. Please reload. (Subject: ${currentSubject})`);
        }

        // Access the .questions array now
        const moduleData = window.questions[currentSubject][currentTest];
        const qData = moduleData.questions[currentQuestionIndex];
        const totalQ = moduleData.questions.length;

        document.getElementById('question-tracker').textContent = `Question ${currentQuestionIndex + 1} / ${totalQ}`;


        const passageEl = document.getElementById('reading-passage');
        const quizContainer = document.querySelector('.quiz-container');

        // Reset Layout
        passageEl.classList.add('hidden');
        quizContainer.classList.remove('split-mode');
        document.getElementById('question-text').textContent = '';
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        // LINKED PASSAGE MODE
        if (qData.passageText) {
            passageEl.textContent = qData.passageText;
            passageEl.classList.remove('hidden');
            quizContainer.classList.add('split-mode'); // Trigger CSS Grid Side-by-Side
        }

        // RENDER BASED ON TYPE

        // 0. FIGURE QUESTION
        if (qData.image) {
            const img = document.createElement('img');
            img.src = qData.image;
            img.className = 'question-figure';
            img.alt = "Question Diagram";

            const figureBox = document.createElement('div');
            figureBox.style.textAlign = 'center';
            figureBox.appendChild(img);
            // Insert before options container
            const qTextBox = document.getElementById('question-text');
            qTextBox.parentNode.insertBefore(figureBox, optionsContainer);
        }

        // 1. ERROR RECOGNITION
        if (qData.type === 'error_recognition') {
            // Render Question Text with Markdown Support (Bold)
            const rawText = qData.question || "";
            const formattedText = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
            document.getElementById('question-text').innerHTML = formattedText;
            const sentenceBox = document.createElement('div');
            sentenceBox.className = 'error-sentence-box';

            // Clean the text of [A], [B] markers first
            let cleanText = qData.text.replace(/\[[A-D]\]\s*/g, '').replace(/\*/g, '');
            let htmlText = cleanText;

            // Sort segments by length to avoid replacing sub-segments accidentally (e.g., "is" vs "island")
            // though unlikely given the context, safest to do.
            // Actually, we must use the segments in order or carefully replace.

            qData.segments.forEach((seg, idx) => {
                // We create the replacement HTML. 
                // We must be careful not to replace inside already replaced tags.
                // A safe way is to split the string? Or just replace global?
                // Given the specific nature of these questions, simple replacement is usually safe enough if text is unique.
                const replacement = `
                    <span class="sentence-segment" onclick="handleAnswer(${idx}, this)" data-idx="${idx}">
                        <span class="segment-text">${seg.text}</span>
                        <span class="segment-label">${seg.label}</span>
                    </span>
                `;
                htmlText = htmlText.replace(seg.text, replacement);
            });

            sentenceBox.innerHTML = htmlText;
            optionsContainer.appendChild(sentenceBox);

            // Add Option E (No Error)
            const noErrorBtn = document.createElement('button');
            noErrorBtn.className = 'option-btn';
            noErrorBtn.style.marginTop = '1.5rem';
            noErrorBtn.onclick = () => handleAnswer(4, noErrorBtn);
            noErrorBtn.innerHTML = `<div class="option-marker">E</div><span>NO ERROR</span>`;
            optionsContainer.appendChild(noErrorBtn);
        }
        // 2. SENTENCE ORDERING
        else if (qData.type === 'sentence_ordering') {
            // Render Question Text with Markdown Support (Bold)
            const rawText = qData.question || "";
            const formattedText = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
            document.getElementById('question-text').innerHTML = formattedText;

            const orderBox = document.createElement('div');
            orderBox.className = 'ordering-box';
            orderBox.innerHTML = qData.options.map(s => `<div class="order-item">${s}</div>`).join('');
            optionsContainer.appendChild(orderBox);

            const choices = qData.orderingChoices || ['Option A', 'Option B', 'Option C', 'Option D'];
            choices.forEach((choiceText, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.onclick = () => handleAnswer(idx, btn);
                const label = String.fromCharCode(65 + idx);
                btn.innerHTML = `<div class="option-marker">${label}</div><span>${choiceText}</span>`;
                optionsContainer.appendChild(btn);
            });

        }
        // 3. STANDARD
        else {
            // Render Question Text with Markdown Support (Bold)
            const rawText = qData.question || "";
            const formattedText = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
            document.getElementById('question-text').innerHTML = formattedText;
            qData.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.onclick = () => handleAnswer(idx, btn);
                const letter = String.fromCharCode(65 + idx); // A, B, C, D, E...
                btn.innerHTML = `<div class="option-marker">${letter}</div><span>${opt}</span>`;
                optionsContainer.appendChild(btn);
            });
        }

        renderMath();
    } catch (e) {
        console.error("Load Error:", e);
        document.getElementById('question-text').textContent = "⚠️ Error loading question: " + e.message;
        document.getElementById('options-container').innerHTML = `<div style="padding:1rem; color:var(--text-secondary)">Please tell the developer: ${e.message}</div>`;
    }
}

function formatErrorSentence(text) {
    return text.replace(/\[([A-D])\]/g, '<span class="error-badge">$1</span>');
}

function handleAnswer(selectedIndex, btnElement) {
    // Select both buttons and segments
    const interactiveElements = document.querySelectorAll('.option-btn, .sentence-segment');
    interactiveElements.forEach(el => {
        el.disabled = true; // Works for buttons
        el.style.pointerEvents = 'none'; // Works for spans/divs
    });

    const qData = window.questions[currentSubject][currentTest].questions[currentQuestionIndex];
    const isCorrect = selectedIndex === qData.correctAnswer;

    if (isCorrect) {
        btnElement.classList.add('correct');
        score++;
    } else {
        btnElement.classList.add('incorrect');

        // Highlight the correct answer
        // We need to find the element that corresponds to the correct index
        // Since we might have buttons OR segments, we check data-idx or implicit order?
        // Safest is to check both collections.

        if (qData.type === 'error_recognition') {
            const allSegments = document.querySelectorAll('.sentence-segment');
            if (allSegments[qData.correctAnswer]) {
                allSegments[qData.correctAnswer].classList.add('correct');
            }
        } else {
            const allBtns = document.querySelectorAll('.option-btn');
            if (allBtns[qData.correctAnswer]) {
                allBtns[qData.correctAnswer].classList.add('correct');
            }
        }
    }

    showFeedback(isCorrect, qData);
}

function showFeedback(isCorrect, qData) {
    const overlay = document.getElementById('feedback-overlay');
    document.getElementById('feedback-status').textContent = isCorrect ? 'Correct!' : 'Incorrect';
    document.getElementById('feedback-status').style.color = isCorrect ? 'var(--success)' : 'var(--error)';

    const correctContainer = document.getElementById('feedback-correct-answer');
    if (!isCorrect) {
        // If ordered/advanced, we might default to just showing explanation or finding the text
        let correctText = '';
        if (qData.type === 'sentence_ordering') correctText = "See ordering above";
        else if (qData.type === 'error_recognition') correctText = qData.segments[qData.correctAnswer].text;
        else correctText = qData.options[qData.correctAnswer];

        correctContainer.innerHTML = `Correct Answer: ${correctText}`;
        correctContainer.style.display = 'block';
    } else {
        correctContainer.style.display = 'none';
    }

    document.getElementById('feedback-explanation').innerHTML = qData.solution;
    renderMath();

    const totalQ = window.questions[currentSubject][currentTest].questions.length;
    document.querySelector('.btn-next').textContent = (currentQuestionIndex === totalQ - 1) ? 'View Results' : 'Next Question →';
    overlay.classList.add('active');
}

function nextQuestion() {
    const totalQ = window.questions[currentSubject][currentTest].questions.length;
    if (currentQuestionIndex < totalQ - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        finishExam();
    }
}

function finishExam() {
    navTo('results');
    const totalQ = window.questions[currentSubject][currentTest].questions.length;
    document.getElementById('score-display').textContent = `${score}/${totalQ}`;

    const pct = (score / totalQ) * 100;
    let rating = 'Keep Practicing';
    if (pct >= 90) rating = 'Excellent (Elite Standard)';
    else if (pct >= 80) rating = 'Very Good (Advanced)';
    else if (pct >= 60) rating = 'Good (Proficient)';

    document.getElementById('rating-text').textContent = rating;
}

// Window click for modal close
window.onclick = function (event) {
    const quickRefModal = document.getElementById('quick-ref-modal');
    const billingModal = document.getElementById('billing-password-modal');
    if (event.target === quickRefModal) {
        closeQuickRef();
    }
    if (event.target === billingModal) {
        closeBillingPasswordModal();
    }
}

function switchQuickRefTab(tabId) {
    // Hide all sections - using class toggle for animation support
    document.querySelectorAll('.ref-section').forEach(el => {
        if (el.id === tabId) {
            el.classList.add('active');
            el.style.display = 'block'; // Ensure display is set
        } else {
            el.classList.remove('active');
            el.style.display = 'none';
        }
    });

    // Update Sidebar Navigation
    const buttons = document.querySelectorAll('.ref-nav-item');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });

    // Ensure MathJax renders on the newly visible content
    if (typeof renderMath === 'function') renderMath();
}

// SKIP LOGIC
let hasSeenSkipWarning = false;

function handleSkipClick() {
    if (hasSeenSkipWarning) {
        confirmSkip();
    } else {
        const modal = document.getElementById('skip-modal');
        modal.classList.remove('hidden');
        // Small delay to allow display flex to apply before opacity transition
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

function closeSkipModal() {
    const modal = document.getElementById('skip-modal');
    modal.classList.remove('active');
    // Wait for transition to finish before hiding
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function confirmSkip() {
    hasSeenSkipWarning = true;
    closeSkipModal();

    const totalQ = window.questions[currentSubject][currentTest].questions.length;
    if (currentQuestionIndex < totalQ - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        finishExam();
    }
}
