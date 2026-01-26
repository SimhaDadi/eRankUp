const axios = require('axios');

const API_URL = 'http://localhost:3001';
let authToken = '';

async function login() {
    console.log('1. Logging in as Admin...');
    try {
        // Assuming default admin credentials or a test user
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        authToken = res.data.access_token;
        console.log('✅ Login successful');
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function verifyPYPCategories() {
    console.log('\n2. Verifying PYP Categories...');
    try {
        // Create an Exam with Category
        const examData = {
            title: `Test PYP ${Date.now()}`,
            type: 'previous_year_paper',
            category: 'SSC',
            defaultPositiveMarks: 1,
            defaultNegativeMarks: 0.25
        };

        const createRes = await axios.post(`${API_URL}/exams`, examData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const examId = createRes.data.id;
        console.log(`   Created PYP with ID: ${examId}, Category: SSC`);

        // Fetch and Filter
        const listRes = await axios.get(`${API_URL}/exams?type=previous_year_paper`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const found = listRes.data.find(e => e.id === examId && e.category === 'SSC');

        if (found) console.log('✅ Verified: Created PYP appears in list with correct Category');
        else console.log('❌ Failed: Created PYP not found or category mismatch');

    } catch (error) {
        console.log('❌ PYP Category verification failed:', error.response?.data || error.message);
    }
}

async function verifyChapterPractice() {
    console.log('\n3. Verifying Chapter-Wise Practice...');
    try {
        // Need a chapter ID. Let's find one from hierarchy
        const hierRes = await axios.get(`${API_URL}/exams/subjects/all`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        let targetChapterId = null;
        // Find breadth-first
        for (const sub of hierRes.data) {
            if (sub.chapters && sub.chapters.length > 0) {
                targetChapterId = sub.chapters[0].id;
                break;
            }
        }

        if (!targetChapterId) {
            console.log('⚠️ No chapters found to test practice mode. Skipping.');
            return;
        }

        console.log(`   Testing Practice for Chapter ID: ${targetChapterId}`);
        const practiceRes = await axios.get(`${API_URL}/exams/practice/${targetChapterId}/start`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (practiceRes.data.questions && Array.isArray(practiceRes.data.questions)) {
            console.log(`✅ Verified: Practice endpoint returned ${practiceRes.data.questions.length} questions`);
        } else {
            console.log('❌ Failed: Practice endpoint invalid response');
        }

    } catch (error) {
        console.log('❌ Practice verification failed:', error.response?.data || error.message);
    }
}

async function run() {
    await login();
    await verifyPYPCategories();
    await verifyChapterPractice();
}

run();
