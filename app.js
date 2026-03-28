'use strict';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const API_BASE = 'http://localhost:5173';

// ═══════════════════════════════════════════════════════════════
// UNIT GROUPS — ES9 Object.freeze
// ═══════════════════════════════════════════════════════════════
const UNIT_GROUPS = Object.freeze({
    Length:      ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
    Weight:      ['KILOGRAM', 'GRAM', 'POUND'],
    Volume:      ['LITRE', 'MILLILITRE', 'GALLON'],
    Temperature: ['CELSIUS', 'FAHRENHEIT'],
});

// Find which group a unit belongs to
function getGroup(unit) {
    const entry = Object.entries(UNIT_GROUPS)
        .find(([, units]) => units.includes(unit));
    return entry ? entry[0] : null;
}

// ═══════════════════════════════════════════════════════════════
// CLASS: QuantityDTO
// ═══════════════════════════════════════════════════════════════
class QuantityDTO {
    constructor(value, unit) {
        this.value = parseFloat(value);
        this.unit  = unit;
    }

    isValid() {
        return !isNaN(this.value) && isFinite(this.value);
    }

    toString() {
        return `${this.value} ${this.unit}`;
    }
}

// ═══════════════════════════════════════════════════════════════
// CLASS: ApiClient
// ═══════════════════════════════════════════════════════════════
class ApiClient {
    #token     = null;
    #userEmail = null;

    get isLoggedIn()  { return this.#token !== null; }
    get email()       { return this.#userEmail; }

    // Private: build auth headers
    #headers() {
        return {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${this.#token}`
        };
    }

    // Private: generic fetch wrapper — handles errors
    async #request(url, options = {}) {
        let response;
        try {
            response = await fetch(url, options);
        } catch {
            throw new Error('Cannot reach the server. Is the API running?');
        }

        const body = await response.json().catch(() => null);

        if (!response.ok) {
            const msg = typeof body === 'string' ? body
                      : body?.message ?? `Error ${response.status}`;
            throw new Error(msg);
        }

        return body;
    }

    // Register — returns Promise<string>
    async register(email, password) {
        const data = await this.#request(`${API_BASE}/api/auth/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        return data.message;
    }

    // Login — stores token, returns Promise<object>
    async login(email, password) {
        const data = await this.#request(`${API_BASE}/api/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        this.#token     = data.token;
        this.#userEmail = data.email;
        return data;
    }

    // Logout — clears token
    logout() {
        this.#token     = null;
        this.#userEmail = null;
    }

    // Arithmetic operations (add / subtract / divide / compare)
    async operate(endpoint, q1, q2) {
        return this.#request(`${API_BASE}/api/quantity/${endpoint}`, {
            method:  'POST',
            headers: this.#headers(),
            body:    JSON.stringify({ q1, q2 })
        });
    }

    // Convert
    async convert(input, targetUnit) {
        return this.#request(`${API_BASE}/api/quantity/convert`, {
            method:  'POST',
            headers: this.#headers(),
            body:    JSON.stringify({ input, targetUnit })
        });
    }

    // History — callback pattern (shows both styles: async/await above, callback here)
    getHistory(type, callback) {
        fetch(`${API_BASE}/api/quantity/history/${type}`, {
            headers: this.#headers()
        })
        .then(res => res.json())
        .then(data => callback(null, data))
        .catch(err => callback(err, null));
    }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════
const api = new ApiClient();

// ═══════════════════════════════════════════════════════════════
// DOM HELPER
// ═══════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

// ═══════════════════════════════════════════════════════════════
// SCREEN SWITCHING
// Show/hide entire screens using CSS class toggle
// ═══════════════════════════════════════════════════════════════
function showScreen(screenId) {
    // Hide all screens first
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('screen--hidden');
    });
    // Show the requested one
    $(screenId).classList.remove('screen--hidden');
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING — toggles form visibility via CSS class
// ═══════════════════════════════════════════════════════════════
function switchTab(tab) {
    const isLogin = (tab === 'login');

    // Show/hide forms using CSS class — NOT the hidden attribute
    if (isLogin) {
        $('formLogin').classList.remove('form--hidden');
        $('formRegister').classList.add('form--hidden');
    } else {
        $('formLogin').classList.add('form--hidden');
        $('formRegister').classList.remove('form--hidden');
    }

    // Toggle active class on tab buttons
    $('tabLogin').classList.toggle('tabs__btn--active', isLogin);
    $('tabRegister').classList.toggle('tabs__btn--active', !isLogin);
}

// ═══════════════════════════════════════════════════════════════
// SHOW APP (after login)
// ═══════════════════════════════════════════════════════════════
function showApp() {
    // Update header — inject email + logout button
    $('headerUser').innerHTML = `
        <span>${api.email}</span>
        <button class="btn btn--ghost" id="logoutBtn">Logout</button>
    `;
    // Attach logout listener to the freshly created button
    $('logoutBtn').addEventListener('click', () => {
        api.logout();
        $('headerUser').innerHTML = '';
        showScreen('screenAuth');
        switchTab('login');
    });

    showScreen('screenApp');
    syncUnit2();
}

// ═══════════════════════════════════════════════════════════════
// REGISTER — form submit handler
// ═══════════════════════════════════════════════════════════════
$('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = $('regEmail').value.trim();
    const pwd   = $('regPwd').value;
    const msg   = $('registerMsg');

    if (!email || !pwd) {
        setMsg(msg, 'Please fill in all fields', 'error');
        return;
    }

    setMsg(msg, 'Creating account…', '');

    try {
        const message = await api.register(email, pwd);
        setMsg(msg, message, 'success');
        // Callback via setTimeout — switch to login tab after 1.4s
        setTimeout(() => switchTab('login'), 1400);
    } catch (err) {
        setMsg(msg, err.message, 'error');
    }
});

// ═══════════════════════════════════════════════════════════════
// LOGIN — form submit handler
// ═══════════════════════════════════════════════════════════════
$('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = $('loginEmail').value.trim();
    const pwd   = $('loginPwd').value;
    const msg   = $('loginMsg');

    if (!email || !pwd) {
        setMsg(msg, 'Please fill in all fields', 'error');
        return;
    }

    setMsg(msg, 'Logging in…', '');

    try {
        await api.login(email, pwd);
        showApp();
    } catch (err) {
        setMsg(msg, err.message, 'error');
    }
});

// ═══════════════════════════════════════════════════════════════
// SYNC UNIT 2 — dynamic dropdown rebuild
// ═══════════════════════════════════════════════════════════════
function syncUnit2() {
    const selected = $('unit1').value;
    const group    = getGroup(selected);
    if (!group) return;

    $('unit2').innerHTML = UNIT_GROUPS[group]
        .map(u => `<option value="${u}">${toLabel(u)}</option>`)
        .join('');
}

// ═══════════════════════════════════════════════════════════════
// RUN OPERATION
// ═══════════════════════════════════════════════════════════════
async function runOperation() {
    const op  = $('opType').value;
    const v1  = $('val1').value;
    const u1  = $('unit1').value;
    const v2  = $('val2').value;
    const u2  = $('unit2').value;
    const box = $('opResult');

    if (!v1 || !v2) {
        showResult(box, 'Please enter both values', true);
        return;
    }

    const q1 = new QuantityDTO(v1, u1);
    const q2 = new QuantityDTO(v2, u2);

    if (!q1.isValid() || !q2.isValid()) {
        showResult(box, 'Values must be valid numbers', true);
        return;
    }

    showResult(box, 'Calculating…', false);

    try {
        const result = await api.operate(op, q1, q2);

        // Conditional logic — different result types per operation
        let display;
        if (typeof result === 'boolean') {
            display = `Equal: ${result}`;
        } else if (typeof result === 'number') {
            display = `Result: ${result}`;
        } else {
            display = `${result.value} ${toLabel(result.unit)}`;
        }

        showResult(box, display, false);
    } catch (err) {
        showResult(box, err.message, true);
    }
}

// ═══════════════════════════════════════════════════════════════
// RUN CONVERT
// ═══════════════════════════════════════════════════════════════
async function runConvert() {
    const val  = $('cvtVal').value;
    const from = $('cvtFrom').value;
    const to   = $('cvtTo').value;
    const box  = $('cvtResult');

    if (!val) {
        showResult(box, 'Please enter a value', true);
        return;
    }

    const input = new QuantityDTO(val, from);
    if (!input.isValid()) {
        showResult(box, 'Value must be a valid number', true);
        return;
    }

    showResult(box, 'Converting…', false);

    try {
        const result = await api.convert(input, to);
        showResult(box, `${result.value} ${toLabel(result.unit)}`, false);
    } catch (err) {
        showResult(box, err.message, true);
    }
}

// ═══════════════════════════════════════════════════════════════
// LOAD HISTORY — callback pattern
// ═══════════════════════════════════════════════════════════════
function loadHistory(type) {
    const tbody = $('histBody');
    tbody.innerHTML = `<tr><td colspan="5" class="table__empty">Loading…</td></tr>`;

    api.getHistory(type, (err, data) => {
        if (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="table__empty">${err.message}</td></tr>`;
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="table__empty">No records found</td></tr>`;
            return;
        }

        // Dynamic UI rendering — Array.map + template literals
        tbody.innerHTML = data.map((item, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.operation}</td>
                <td>${item.operand1}</td>
                <td>${item.operand2}</td>
                <td>${item.result}</td>
            </tr>
        `).join('');
    });
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function showResult(el, message, isError) {
    el.textContent = message;
    el.classList.remove('result--hidden');
    el.classList.toggle('result--error', isError);
}

function setMsg(el, msg, type) {
    el.textContent = msg;
    el.className   = `form__msg${type ? ' form__msg--' + type : ''}`;
}

// FEET → Feet, MILLILITRE → Millilitre
function toLabel(unit) {
    return unit.charAt(0) + unit.slice(1).toLowerCase();
}

// ═══════════════════════════════════════════════════════════════
// IIFE — initialise on page load
// ═══════════════════════════════════════════════════════════════
(function init() {
    showScreen('screenAuth');   // auth screen visible on load
    switchTab('login');         // login tab active by default
    syncUnit2();                // populate unit2 dropdown
}());