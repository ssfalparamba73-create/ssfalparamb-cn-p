import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2].replace(/^"|"$/g, '');
    }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = 'http://localhost:3000';

let cookieStore = {};

function updateCookies(res) {
    const setCookieHeaders = res.headers.raw ? res.headers.raw()['set-cookie'] : [res.headers.get('set-cookie')].filter(Boolean);
    if (!setCookieHeaders) return;
    for (const header of setCookieHeaders) {
        if (!header) continue;
        const parts = header.split(';');
        const [name, ...valueParts] = parts[0].split('=');
        cookieStore[name.trim()] = valueParts.join('=');
    }
}

function getCookieString() {
    return Object.entries(cookieStore).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function request(path, options = {}) {
    const headers = { ...options.headers };
    const cookieStr = getCookieString();
    if (cookieStr) headers['Cookie'] = cookieStr;
    
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    updateCookies(res);
    
    let data = null;
    try { data = await res.json(); } catch(e) {}
    
    return { status: res.status, data, headers: res.headers };
}

async function runTests() {
    console.log("Starting tests without JS seeding...");
    
    console.log("1. GET /api/v1/auth/session without application cookie");
    let res = await request('/api/v1/auth/session');
    console.log(`Status: ${res.status} (Expected: 401)`);
    
    console.log("2. POST /api/v1/auth/logout without cookie");
    res = await request('/api/v1/auth/logout', { method: 'POST' });
    console.log(`Status: ${res.status} (Expected: 200)`);
    
    console.log("3. POST /api/v1/auth/member/login with invalid payload");
    res = await request('/api/v1/auth/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '8888888888' })
    });
    console.log(`Status: ${res.status} (Expected: 400)`);
    
    console.log("4. POST /api/v1/auth/admin/login with invalid payload");
    res = await request('/api/v1/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9999999999' })
    });
    console.log(`Status: ${res.status} (Expected: 400)`);
    
    console.log("5. Valid member login");
    res = await request('/api/v1/auth/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '8888888888', pin: '1234' })
    });
    console.log(`Status: ${res.status} (Expected: 200)`);
    console.log(`Set-Cookie present: ${!!res.headers.get('set-cookie')}`);
    
    console.log("7. Session restore using received cookie (Member)");
    res = await request('/api/v1/auth/session');
    console.log(`Status: ${res.status} (Expected: 200)`);
    
    console.log("8. Logout and verify session becomes invalid");
    res = await request('/api/v1/auth/logout', { method: 'POST' });
    console.log(`Logout Status: ${res.status} (Expected: 200)`);
    res = await request('/api/v1/auth/session');
    console.log(`Restore Status: ${res.status} (Expected: 401)`);
    
    console.log("6. Valid admin login");
    res = await request('/api/v1/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9999999999', code: '123456' })
    });
    console.log(`Status: ${res.status} (Expected: 200)`);
    
    res = await request('/api/v1/auth/logout', { method: 'POST' });
    
    console.log("9. Invalid credentials test");
    res = await request('/api/v1/auth/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '8888888888', pin: '0000' })
    });
    console.log(`Status: ${res.status} (Expected: 200 with error INVALID_CREDENTIALS or 400)`);
    
    console.log("10. Five failed login attempts and verify lockout response");
    for(let i=0; i<4; i++) {
        await request('/api/v1/auth/member/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '8888888888', pin: '0000' })
        });
    }
    res = await request('/api/v1/auth/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '8888888888', pin: '0000' })
    });
    console.log(`Status: ${res.status} Data:`, res.data);
}

runTests().catch(console.error);
