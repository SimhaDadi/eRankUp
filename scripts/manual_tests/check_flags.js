
const { Client } = require('pg');

async function check() {
    const client = new Client({
        user: 'admin', host: 'localhost', database: 'erankup_db', password: 'password', port: 5432,
    });
    try {
        await client.connect();
        const res = await client.query('SELECT id, title, "isActive", "isPublished", "isPremium" FROM exam WHERE id = \'f94d3cde-bcac-4628-b637-f0940ce00104\'');
        console.log(res.rows[0]);
    } catch (err) { console.error(err); } finally { await client.end(); }
}
check();
