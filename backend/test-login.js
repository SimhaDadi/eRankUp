const axios = require('axios');

async function testLogin() {
    console.log("Testing Login API...");
    const url = 'http://127.0.0.1:3001/auth/login';
    // exact payload frontend sends
    const payload = {
        email: 'sivadadi114@gmail.com',
        password: 'password123'
    };

    try {
        console.log(`POST ${url}`);
        const response = await axios.post(url, payload);
        console.log("✅ Status:", response.status);
        console.log("✅ Token received:", response.data.access_token ? "YES" : "NO");
        console.log("✅ User:", response.data.user);
    } catch (error) {
        console.error("❌ Login Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else if (error.request) {
            console.error("No response received. Network/Port issue?");
            console.error(error.message);
        } else {
            console.error("Error setting up request:", error.message);
        }
    }
}

testLogin();
