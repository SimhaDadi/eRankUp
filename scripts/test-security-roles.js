const BASE_URL = 'http://localhost:3001';

async function run() {
    console.log('🛡️ Starting Role/Auth Security Verification...');

    // --- Helpers ---
    async function request(method, path, token, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        return {
            status: res.status,
            data: await res.json().catch(() => ({}))
        };
    }

    try {
        // 1. Setup Identities
        console.log('[1] Setting up identities...');

        // Student Identity
        const studentEmail = `security_student_${Date.now()}@test.com`;
        await request('POST', '/auth/signup', null, {
            email: studentEmail,
            password: 'password123',
            fullName: 'Security Student',
            role: 'student'
        });
        const studentAuth = await request('POST', '/auth/login', null, {
            email: studentEmail,
            password: 'password123'
        });
        const studentToken = studentAuth.data.access_token;
        console.log(`    Student Token Obtained (${studentEmail})`);

        // Admin Identity (for comparison/setup if needed)
        const adminAuth = await request('POST', '/auth/login', null, {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        const adminToken = adminAuth.data.access_token;

        const results = [];

        async function verifyForbidden(desc, method, path, token, body) {
            process.stdout.write(`    Testing: ${desc}... `);
            const res = await request(method, path, token, body);
            if (res.status === 403 || res.status === 401) {
                console.log('✅ Forbidden/Unauthorized as expected');
                results.push({ name: desc, success: true });
            } else {
                console.log(`❌ VULNERABILITY! Got status ${res.status}`);
                results.push({ name: desc, success: false });
            }
        }

        // 2. Run Forbidden Access Tests
        console.log('\n[2] Verifying Student Blocked from Admin Routes...');

        await verifyForbidden('Create Exam', 'POST', '/exams', studentToken, { title: 'Hacker Exam' });
        await verifyForbidden('Delete Exam', 'DELETE', '/exams/non-existent-id', studentToken);
        await verifyForbidden('Publish Exam', 'PUT', '/exams/non-existent-id/publish', studentToken, { isPublished: true });
        await verifyForbidden('Create Subject', 'POST', '/subjects', studentToken, { title: 'Hacked Sub' });
        await verifyForbidden('Bulk Upload Questions', 'POST', '/questions/bulk-upload', studentToken, {});
        await verifyForbidden('Send Admin Notifications', 'POST', '/admin/notifications/send', studentToken, { message: 'hi' });
        await verifyForbidden('Delete Model (via Chapters)', 'DELETE', '/exams/subjects/sub-id/chapters/chapter-id', studentToken);

        // 3. Verify No Token Access
        console.log('\n[3] Verifying Unauthenticated Access...');
        await verifyForbidden('Get Admin Hierarchy (No Token)', 'GET', '/exams/hierarchy', null);

        // 4. Verification Summary
        console.log('\n--- SECURITY SUMMARY ---');
        const total = results.length;
        const passed = results.filter(r => r.success).length;
        console.log(`Passed: ${passed}/${total}`);

        if (passed === total) {
            console.log('\n✨ SECURITY VERIFICATION PASSED ✨');
        } else {
            console.error('\n⚠️ SECURITY VULNERABILITIES DETECTED ⚠️');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ ERROR DURING SECURITY TEST:', error.message);
        process.exit(1);
    }
}

run();
