const { Client } = require('pg');
require('dotenv').config();

async function checkConnection() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'erankup_db',
    };

    console.log('Testing connection with config:', { ...config, password: '***' });

    const client = new Client(config);

    try {
        await client.connect();
        console.log('SUCCESS: Connected to database');

        const res = await client.query('SELECT current_database(), current_user');
        console.log('DB Details:', res.rows[0]);

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: Could not connect to database');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        process.exit(1);
    }
}

checkConnection();
