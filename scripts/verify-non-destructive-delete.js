const axios = require('axios');

async function testNonDestructiveDelete() {
    const adminToken = 'ADMIN_TOKEN_HERE'; // We'll need to login or use existing session
    const API_URL = 'http://localhost:3001';

    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        const token = loginRes.data.access_token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('2. Creating Test Hierarchy (Exam -> Subject -> Chapter)...');
        const examRes = await axios.post(`${API_URL}/exams`, {
            title: 'Delete Test Exam',
            type: 'real_exam'
        }, config);
        const examId = examRes.data.id;

        const subjectRes = await axios.post(`${API_URL}/exams/subjects`, {
            title: 'Persistent Subject',
            examId: examId
        }, config);
        const subjectId = subjectRes.data.id;

        const chapterRes = await axios.post(`${API_URL}/exams/subjects/${subjectId}/chapters`, {
            title: 'Persistent Chapter'
        }, config);
        const chapterId = chapterRes.data.id;

        console.log('3. Deleting Exam...');
        await axios.delete(`${API_URL}/exams/${examId}`, config);
        console.log('✅ Exam deleted');

        console.log('4. Verifying persistence of Subject and Chapter...');
        // We'll use a direct DB check if possible, or an admin-only list endpoint
        // Since subjects aren't deleted, listing all subjects should still return it
        const subjectsRes = await axios.get(`${API_URL}/subjects`, config);
        const savedSubject = subjectsRes.data.find(s => s.id === subjectId);

        if (savedSubject) {
            console.log('✅ SUCCESS: Subject still exists after Exam deletion.');

            // Re-fetch subject with chapters to verify hierarchy persistence
            const subjectDetailRes = await axios.get(`${API_URL}/subjects/${subjectId}`, config);
            const chapterExists = subjectDetailRes.data.chapters?.some(c => c.id === chapterId);

            if (chapterExists) {
                console.log('✅ SUCCESS: Chapter-Subject hierarchy is preserved.');
            } else {
                console.log('❌ FAIL: Chapter was unlinked or deleted from Subject.');
            }
        } else {
            console.log('❌ FAIL: Subject was deleted with the Exam.');
        }

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testNonDestructiveDelete();
