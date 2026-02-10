const { Client } = require('pg');

const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'erankup_db',
    password: 'password',
    port: 5432,
});

async function run() {
    await client.connect();
    const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

    console.log('Table Name');
    console.log('----------');
    res.rows.forEach(row => {
        console.log(row.table_name);
    });

    await client.end();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
