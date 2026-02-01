const fetch = require('node-fetch');

async function testAuthAndCSV() {
    const baseUrl = 'http://localhost:3001';
    const timestamp = Date.now();
    const email = `prod_${timestamp}@example.com`;
    const password = 'password123';

    console.log(`--- Starting Production Ready Verification ---`);

    // 1. Test Login & Initial Tokens
    console.log(`\n[Test 1] Testing Signup and Login (Dual Token)...`);
    await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: 'Prod User' })
    });

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();

    if (loginData.access_token && loginData.refresh_token) {
        console.log('PASS: Received both access_token and refresh_token');
    } else {
        console.error('FAIL: Missing tokens', loginData);
    }

    // 2. Test Refresh Token Rotation
    console.log(`\n[Test 2] Testing Token Refresh...`);
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: loginData.user.id,
            refreshToken: loginData.refresh_token
        })
    });
    const refreshData = await refreshRes.json();
    if (refreshRes.ok && refreshData.access_token && refreshData.refresh_token) {
        console.log('PASS: Token refresh successful and rotated');
    } else {
        console.error('FAIL: Refresh failed', refreshData);
    }

    // 3. Test Logout
    console.log(`\n[Test 3] Testing Logout...`);
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${refreshData.access_token}`
        }
    });
    if (logoutRes.status === 200) {
        console.log('PASS: Logout successful');
    } else {
        console.error('FAIL: Logout failed', logoutRes.status);
    }

    // 4. Test Streamed CSV Export
    console.log(`\n[Test 4] Testing Streamed CSV Export...`);
    // Note: We need admin login for this
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@erankup.com', password: 'adminpassword' })
    });
    const { access_token: adminToken } = await adminLoginRes.json();

    const exportRes = await fetch(`${baseUrl}/admin/content/export`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const exportContentType = exportRes.headers.get('content-type') || '';
    if (exportRes.ok && exportContentType.includes('text/csv')) {
        const text = await exportRes.text();
        console.log(`PASS: CSV Export successful. Received ${text.split('\n').length} lines`);
    } else {
        console.error('FAIL: CSV Export failed', exportRes.status, 'Content-Type:', exportContentType);
    }

    console.log(`\n--- Production Verification Complete ---`);
}

testAuthAndCSV().catch(console.error);
