// Test script for AI Explanation Generator
// Run this after starting the backend with: node test-ai-explanations.js

const axios = require('axios');

const API_URL = 'http://localhost:3001';
let authToken = '';

// Test credentials (adjust as needed)
const ADMIN_CREDENTIALS = {
    email: 'admin@erankup.com',
    password: 'adminpassword'
};

async function login() {
    console.log('🔐 Logging in as admin...');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
        authToken = response.data.access_token;
        console.log('✅ Login successful!\n');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        if (error.code) console.error('   Error Code:', error.code);
        if (error.response?.status) console.error('   Status:', error.response.status);
        if (error.response?.data) console.error('   Data:', JSON.stringify(error.response.data));
        return false;
    }
}

async function getTestQuestion() {
    console.log('🔍 Fetching existing question...');
    try {
        // 1. Get all exams
        const examsResponse = await axios.get(`${API_URL}/exams`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const exams = examsResponse.data;
        if (!exams || exams.length === 0) {
            console.error('❌ No exams found in the database. Please run seeders.');
            return null;
        }

        const examId = exams[0].id;
        console.log(`   Found Exam ID: ${examId} (${exams[0].title})`);

        // 2. Get questions for this exam
        const questionsResponse = await axios.get(`${API_URL}/exams/questions/exam/${examId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        let questions = questionsResponse.data.questions;

        if (!questions || questions.length === 0) {
            console.log('⚠️  No exam-specific questions found. Trying global questions...');
            try {
                const globalResponse = await axios.get(`${API_URL}/exams/questions/global`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                questions = globalResponse.data.questions;
            } catch (err) {
                console.log('⚠️  Could not fetch global questions either.');
            }
        }
        if (!questions || questions.length === 0) {
            console.error('❌ No questions found for this exam.');
            return null;
        }

        const question = questions[0];
        console.log('✅ Found existing question!');
        console.log(`   Question ID: ${question.id}`);
        console.log(`   Text: ${question.content.substring(0, 50)}...\n`);

        return question.id;
    } catch (error) {
        console.error('❌ Failed to fetch question:', error.response?.data?.message || error.message);
        if (error.response?.data) console.error('   Details:', JSON.stringify(error.response.data));
        return null;
    }
}

async function generateExplanation(questionId) {
    console.log(`🤖 Generating AI explanation for question ${questionId}...`);
    console.log('   (This may take 2-3 seconds)\n');

    try {
        const startTime = Date.now();
        const response = await axios.post(
            `${API_URL}/explanations/generate/${questionId}`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Explanation generated in ${duration}s!`);
        console.log('\n📄 Generated Explanation:');
        console.log('─'.repeat(80));
        console.log(response.data.explanation);
        console.log('─'.repeat(80));
        console.log('\n');
        return response.data;
    } catch (error) {
        console.error('❌ Failed to generate explanation:', error.response?.data?.message || error.message);
        if (error.response?.data?.error) {
            console.error('   Error details:', error.response.data.error);
        }
        return null;
    }
}

async function batchGenerateExplanations(questionId) {
    console.log('🚀 Testing batch explanation generation...');
    console.log('   (Testing with the single created question)\n');

    try {
        const startTime = Date.now();
        // The new bulk endpoint requires specific IDs
        const response = await axios.post(
            `${API_URL}/explanations/bulk-generate`,
            { questionIds: [questionId] },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Batch generation completed in ${duration}s!`);
        console.log(`   Generated: ${response.data.generated} explanations`);
        console.log(`   Question IDs: ${response.data.questionIds.join(', ')}`);

        console.log('\n');
        return response.data;
    } catch (error) {
        console.error('❌ Batch generation failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function runTests() {
    console.log('\n🧪 AI Explanation Generator - Test Suite\n');
    console.log('='.repeat(80));
    console.log('\n');

    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('\n❌ Tests aborted: Login failed');
        return;
    }

    // Step 2: Get test question
    const questionId = await getTestQuestion();
    if (!questionId) {
        console.log('\n⚠️  Skipping single explanation test (question creation failed)');
    } else {
        // Step 3: Generate single explanation
        await generateExplanation(questionId);
    }

    // Step 4: Batch generate explanations
    await batchGenerateExplanations(questionId);

    console.log('='.repeat(80));
    console.log('\n✅ Test suite completed!\n');
    console.log('Next steps:');
    console.log('  1. Check the results page to see explanations displayed');
    console.log('  2. Verify the ExplanationCard component renders correctly');
    console.log('  3. Test the admin panel "Generate Explanations" button\n');
}

// Run the tests
runTests().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
});
