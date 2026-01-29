
const { Client } = require('pg');
async function run() {
    const client = new Client({
        user: 'admin', host: 'localhost', database: 'erankup_db', password: 'password', port: 5432,
    });
    try {
        await client.connect();
        const res = await client.query('SELECT id, email, role FROM "user" LIMIT 10');
        console.log(res.rows);
    } catch (err) { console.error(err); } finally { await client.end(); }
}
run();
