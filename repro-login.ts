import axios from 'axios';

async function reproLogin() {
    console.log('--- REPRODUCING LOGIN 500 ERROR ---');
    const API_URL = 'http://localhost:3001';
    const credentials = {
        email: 'admin@erankup.com',
        password: 'adminpassword'
    };

    try {
        console.log(`Attempting login for ${credentials.email}...`);
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        console.log('Login Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Login Failed (500):', error.response.status, error.response.data);
        } else {
            console.error('Network Error:', error.message);
        }
    }
}

reproLogin();
