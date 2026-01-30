
const { Client } = require('pg');
async function list() {
    const client = new Client({
        user: 'admin',
        host: 'localhost',
        database: 'erankup_db',
        password: 'password',
        port: 5432,
    });
    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log(res.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
list();
