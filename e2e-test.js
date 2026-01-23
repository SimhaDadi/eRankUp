// Native fetch used in Node 18+

const BASE_URL = 'http://localhost:3001';

async function run() {
    console.log('Starting E2E API Verification...');

    // 1. Login Admin
    console.log('\n[1] Logging in as Admin...');
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@erankup.com', password: 'adminpassword' })
    });

    if (!adminRes.ok) {
        console.error('Admin login failed:', await adminRes.text());
        process.exit(1);
    }
    const adminData = await adminRes.json();
    const adminToken = adminData.access_token;
    console.log('Admin Logged In.');

    // 2. Create Student (or Login)
    console.log('\n[2] Preparing Student Account...');
    let studentToken;
    const studentEmail = `student_${Date.now()}@test.com`;
    const studentPass = 'password123';

    // Register
    const regRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: studentPass, fullName: 'Test Student', role: 'student' })
    });

    if (regRes.ok) {
        console.log('Student Registered.');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentEmail, password: studentPass })
        });
        const d = await loginRes.json();
        studentToken = d.access_token;
    } else {
        console.error('Registration failed:', await regRes.text());
        process.exit(1);
    }

    // 3. Admin: Create Question Bank
    console.log('\n[3] Creating Question Bank...');
    const qbRes = await fetch(`${BASE_URL}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
            title: 'E2E Question Bank',
            description: 'Bank for E2E',
            type: 'question_bank'
            // isPublished removed to pass DTO validation if old server running
        })
    });
    if (!qbRes.ok) {
        console.error('Create Question Bank Failed:', await qbRes.text());
        process.exit(1);
    }
    const qb = await qbRes.json();
    console.log(`Question Bank Created: ${qb.id}`);

    // Hierarchy
    console.log('Creating Subject/Chapter/Model...');
    const subRes = await fetch(`${BASE_URL}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ title: 'E2E Subject', examId: qb.id })
    });
    if (!subRes.ok) {
        console.error('Create Subject Failed:', await subRes.text());
        process.exit(1);
    }
    const sub = await subRes.json();

    const chapRes = await fetch(`${BASE_URL}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ title: 'E2E Chapter', subjectId: sub.id })
    });
    if (!chapRes.ok) {
        console.error('Create Chapter Failed:', await chapRes.text());
        process.exit(1);
    }
    const chap = await chapRes.json();

    const modRes = await fetch(`${BASE_URL}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ title: 'E2E Model', chapterId: chap.id })
    });
    if (!modRes.ok) {
        console.error('Create Model Failed:', await modRes.text());
        process.exit(1);
    }
    const mod = await modRes.json();
    console.log(`Model Created: ${mod.id}`);

    // Create Question
    console.log('Adding Question to Model...');
    const validQRes = await fetch(`${BASE_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
            questionText: 'E2E Test Question',
            options: ['Opt1', 'Opt2', 'Opt3', 'Opt4'],
            correctAnswer: 0,
            topic: 'Testing',
            difficulty: 'medium',
            subjectId: sub.id,
            chapterId: chap.id,
            exams: [{ id: qb.id }]
        })
    });

    if (!validQRes.ok) {
        console.error('Create Question Failed:', await validQRes.text());
        process.exit(1);
    }
    const quest = await validQRes.json();
    console.log(`Question Created: ${quest.id}`);

    // 4. Admin: Create Real Exam
    console.log('\n[4] Creating Real Exam...');
    const examRes = await fetch(`${BASE_URL}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
            title: 'E2E Real Exam',
            description: 'For Student',
            type: 'real_exam'
            // isPublished removed
        })
    });
    if (!examRes.ok) {
        console.error('Create Real Exam Failed:', await examRes.text());
        process.exit(1);
    }
    const realExam = await examRes.json();
    console.log(`Real Exam Created (Draft): ${realExam.id}`);

    // 5. Link Question
    console.log('\n[5] Linking Question...');
    const linkRes = await fetch(`${BASE_URL}/exams/${realExam.id}/link-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ questionIds: [quest.id] })
    });
    if (!linkRes.ok) {
        console.error('Link Questions Failed:', await linkRes.text());
        process.exit(1);
    }
    console.log('Link Response:', await linkRes.json());

    // 6. Verify Student Visibility (Draft)
    console.log('\n[6] Checking Student Visibility (Draft)...');
    const studentDraftRes = await fetch(`${BASE_URL}/exams`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentDraftExams = await studentDraftRes.json();
    const foundInDraft = studentDraftExams.find(e => e.id === realExam.id);
    console.log(`Visible in Draft? ${!!foundInDraft}`);
    if (foundInDraft) {
        console.error('FAIL: Student sees Draft exam!');
        process.exit(1);
    } else {
        console.log('PASS: Student cannot see Draft.');
    }

    // 7. Publish
    console.log('\n[7] Publishing Exam...');
    const pubRes = await fetch(`${BASE_URL}/exams/${realExam.id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ isPublished: true })
    });
    if (!pubRes.ok) {
        console.error('Publish Failed:', await pubRes.text());
        process.exit(1);
    }
    console.log('Exam Published.');

    // 8. Verify Student Visibility (Published)
    console.log('\n[8] Checking Student Visibility (Published)...');
    const studentPubRes = await fetch(`${BASE_URL}/exams`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentPubExams = await studentPubRes.json();
    const foundPub = studentPubExams.find(e => e.id === realExam.id);
    console.log(`Visible Published? ${!!foundPub}`);
    if (!foundPub) {
        console.error('FAIL: Student cannot see Published exam!');
        process.exit(1);
    } else {
        console.log('PASS: Student sees Published exam.');
    }

    console.log('\nSUCCESS: End-to-End Verification Passed!');
}

run().catch(e => console.error(e));
