const BASE_URL = 'http://localhost:3001';

async function run() {
    console.log('🔍 Listing All Exams...');

    async function request(method, path, token) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}${path}`, { method, headers });
        if (!res.ok) return []; // or throw
        return res.json().catch(() => ([]));
    }

    try {
        // Login
        const adminAuth = await request('POST', '/auth/login', null).then(r => r || {});
        // If helper above fails for login body, do explicit fetch
        const authRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@erankup.com', password: 'adminpassword' })
        });
        const adminData = await authRes.json();
        const token = adminData.access_token;

        const exams = await request('GET', '/exams', token);

        console.log(`Found ${exams.length} exams:`);
        exams.forEach(e => {
            console.log(`- [${e.id}] "${e.title}" (Published: ${e.isPublished})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();
