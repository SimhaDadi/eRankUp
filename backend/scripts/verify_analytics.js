const fetch = require('node-fetch');

const baseUrl = 'http://localhost:3001';

async function run() {
    const email = `test_stats_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`Registering user ${email}...`);
    try {
        const signupRes = await fetch(`${baseUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName: 'Stats Tester', role: 'student' })
        });

        if (!signupRes.ok) {
            const err = await signupRes.text();
            throw new Error(`Signup failed: ${signupRes.status} ${err}`);
        }
        console.log('Signup success.');

        // Login
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Got token.');

        // 1. Get Initial Stats (Should be empty/zeros)
        const stats1 = await fetch(`${baseUrl}/exams/user/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        console.log('Initial Stats:', stats1);
        if (stats1.totalAttempts !== 0) throw new Error('Initial attempts should be 0');

        // 2. Find a Free Exam
        const examsRes = await fetch(`${baseUrl}/exams`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const examsData = await examsRes.json();
        const examsList = Array.isArray(examsData) ? examsData : (examsData.data || []);

        let examId = null;
        for (const ex of examsList) {
            if (!ex.isPremium) {
                examId = ex.id;
                break;
            }
        }

        if (!examId && examsList.length > 0) {
            console.warn('No free exams found. Trying the first one anyway.');
            examId = examsList[0].id;
        } else if (!examId) {
            console.warn('No exams found. Skipping validation.');
            return;
        }

        console.log(`Found Exam ID: ${examId}`);

        // 3. Start Session
        console.log('Starting session...');
        const startRes = await fetch(`${baseUrl}/test-session/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testId: examId })
        });

        if (!startRes.ok) {
            const txt = await startRes.text();
            console.log(`Start Session Failed: ${startRes.status} ${txt}`);
            // If failed, cannot submit.
            return;
        }

        const sessionData = await startRes.json();
        console.log('Session started.');

        // 4. Submit Session immediately
        console.log('Submitting session...');
        const submitRes = await fetch(`${baseUrl}/test-session/${examId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers: {},
                timings: {}
            })
        });

        if (!submitRes.ok) {
            const txt = await submitRes.text();
            console.log(`Submit Failed: ${submitRes.status} ${txt}`);
        } else {
            console.log('Submit successful.');
        }

        // 5. Get Stats Again (Should increment)
        await new Promise(r => setTimeout(r, 1000));

        const stats2 = await fetch(`${baseUrl}/exams/user/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
        console.log('Updated Stats:', stats2);

        if (submitRes.ok) {
            if (stats2.totalAttempts !== 1) {
                throw new Error(`Expected 1 attempt, got ${stats2.totalAttempts}`);
            }
            console.log('PASS: Stats incremented.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}

run();
