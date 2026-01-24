
const BASE_URL = 'http://localhost:3001';

async function testQueue() {
    console.log('🚦 Testing Centralized AI Queue...');

    // We need an endpoint that triggers AI.
    // ExplanationService.generateMissingExplanations is good as it triggers bulk.
    // Or we can mock it?
    // Actually, we can just use the debug-ai.js logic but that uses the library directly (bypassing backend queue).
    // We must call the BACKEND API to test the backend queue.

    // Admin Login
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@erankup.com', password: 'adminpassword' })
    });
    const { access_token } = await adminRes.json();

    console.log(' triggering bulk generation attempt...');

    // This endpoint triggers background generation.
    // If working correctly, we should see logs in the backend console spacing out requests by 4s.
    const res = await fetch(`${BASE_URL}/explanations/bulk-generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // We need some question IDs. 
            // If we don't send IDs, it finds missing. 
            // If no missing, it does nothing.
            // Let's rely on manual observation of logs or existing missing questions.
            limit: 5
        })
    });

    console.log('Response:', await res.json());
    console.log('✅ Request sent. Check backend logs for "Waiting 4000ms..." messages.');
}

testQueue();
