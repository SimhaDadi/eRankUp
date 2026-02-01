const { Client } = require('pg');
const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'erankup_db',
    password: 'password',
    port: 5432,
});

async function check() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_gamification'");
        console.log(res.rows.map(r => r.column_name));
        await client.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
