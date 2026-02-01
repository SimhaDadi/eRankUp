const baseUrl = 'http://localhost:3001';

async function run() {
    const email = `test_pag_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`Registering user ${email}...`);
    try {
        const signupRes = await fetch(`${baseUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName: 'Pagination Tester' })
        });

        if (!signupRes.ok) {
            console.error('Signup failed:', await signupRes.text());
            // If conflict, try login directly (maybe user collision unlikely with Date.now but safe)
        }

        console.log('Login...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Got token.');

        // Test Pagination: Page 1
        console.log('Testing Page 1 Limit 2...');
        const res1 = await fetch(`${baseUrl}/exams?page=1&limit=2`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data1 = await res1.json();

        if (!data1.meta) {
            console.error('FAIL: Meta missing in response');
            console.log(data1);
        } else {
            console.log('PASS: Meta present');
            console.log(`Total Exams: ${data1.meta.total}`);
            console.log(`Returned: ${data1.data.length}`);
            if (data1.data.length <= 2) console.log('PASS: Limit respected');
            else console.error('FAIL: Limit ignored');
        }

        // Test Pagination: Legacy (No params)
        console.log('Testing Legacy Mode (No params)...');
        const res2 = await fetch(`${baseUrl}/exams`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        if (Array.isArray(data2)) {
            console.log('PASS: Legacy mode returns Array');
        } else {
            console.error('FAIL: Legacy mode returned object');
            console.log(JSON.stringify(data2, null, 2));
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
