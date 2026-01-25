const BASE_URL = 'http://localhost:3001';

async function run() {
    console.log('🧹 Starting Golden Path Cleanup...');

    // --- Helpers ---
    async function request(method, path, token, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
        }
        return res.json().catch(() => ({}));
    }

    try {
        // 1. Admin Login
        console.log('[1] Logging in as Admin...');
        const adminAuth = await request('POST', '/auth/login', null, { email: 'admin@erankup.com', password: 'adminpassword' });
        const adminToken = adminAuth.access_token;

        // 2. Fetch All Exams
        console.log('[2] Fetching exams...');
        const exams = await request('GET', '/exams', adminToken);

        // 3. Filter Test Exams
        const testExams = exams.filter(e => e.title && e.title.includes('Golden Path'));

        if (testExams.length === 0) {
            console.log('✨ No Golden Path exams found to delete.');
            return;
        }

        console.log(`[3] Found ${testExams.length} test exams. Deleting...`);

        // 4. Delete Each
        for (const exam of testExams) {
            process.stdout.write(`    Deleting "${exam.title}" (${exam.id})... `);
            try {
                await request('DELETE', `/exams/${exam.id}`, adminToken);
                console.log('✅');
            } catch (err) {
                console.log('❌');
                console.error(`    Failed to delete ${exam.id}: ${err.message}`);
            }
        }

        console.log('\n✨ Cleanup Complete ✨');

    } catch (error) {
        console.error('\n❌ CLEANUP FAILED:', error.message);
        process.exit(1);
    }
}

run();
