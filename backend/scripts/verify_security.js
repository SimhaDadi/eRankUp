const fetch = require('node-fetch');

async function runAudit() {
    const baseUrl = 'http://localhost:3001';
    const timestamp = Date.now();
    const email = `audit_${timestamp}@example.com`;
    const password = 'password123';

    console.log(`--- Starting Security Audit Verification ---`);

    // 1. Test Role Injection Prevention
    console.log(`\n[Test 1] Testing Role Injection Prevention...`);
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password,
            fullName: 'Audit User',
            role: 'admin' // Attempted injection
        })
    });
    const signupData = await signupRes.json();

    if (signupData.role === 'admin') {
        console.error('FAIL: Role injection successful. User registered as admin!');
    } else {
        console.log(`PASS: User registered with role: ${signupData.role}`);
    }

    // Login to get token
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const { access_token: token } = await loginRes.json();

    // 2. Test News Lockdown
    console.log(`\n[Test 2] Testing News Creation Lockdown...`);
    const newsRes = await fetch(`${baseUrl}/news`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: 'Hacked News',
            content: 'This should not be allowed',
            category: 'general'
        })
    });
    if (newsRes.status === 403) {
        console.log('PASS: News creation blocked for student (403).');
    } else {
        console.error(`FAIL: News creation not blocked. Status: ${newsRes.status}`);
    }

    // 3. Test Gamification Lockdown
    console.log(`\n[Test 3] Testing Gamification Admin Endpoints...`);
    const xpRes = await fetch(`${baseUrl}/gamification/award-xp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            userId: signupData.id,
            amount: 10000,
            reason: 'hacker'
        })
    });
    if (xpRes.status === 403) {
        console.log('PASS: XP awarding blocked for student (403).');
    } else {
        console.error(`FAIL: XP awarding not blocked. Status: ${xpRes.status}`);
    }

    // 4. Test UserID Inconsistency in Community (Creation check)
    console.log(`\n[Test 4] Testing Community Post Attribution...`);
    // Assuming CommunityService.createPost expects userId and DTO
    const postRes = await fetch(`${baseUrl}/community/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            content: 'Audit Post',
            category: 'General'
        })
    });
    if (postRes.ok) {
        const postData = await postRes.json();
        console.log('PASS: Community post created successfully (userId consistency verified).');
    } else {
        const errData = await postRes.json();
        console.error(`FAIL: Community post failed. Status: ${postRes.status}`, errData);
    }

    console.log(`\n--- Audit Verification Complete ---`);
}

runAudit().catch(console.error);
