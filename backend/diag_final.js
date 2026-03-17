const { Client } = require('pg');

async function checkDb() {
  console.log('--- BACKEND DB CHECK ---');
  console.log('Env DB_NAME:', process.env.DB_NAME);
  console.log('Env DB_USER:', process.env.DB_USER);
  console.log('Env DB_HOST:', process.env.DB_HOST);

  const client = new Client({
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'postgres',
    database: process.env.DB_NAME || 'erankup_db',
    password: process.env.DB_PASSWORD || 'password',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected!');

    const res = await client.query('SELECT current_database(), current_user');
    console.log('Database:', res.rows[0].current_database);
    console.log('User:', res.rows[0].current_user);

    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in public schema:', tables.rows.map(t => t.table_name).join(', '));

    const statsCheck = await client.query("SELECT COUNT(*) FROM user_stats").catch(e => ({ error: e.message }));
    if (statsCheck.error) {
      console.log('Error querying user_stats:', statsCheck.error);
    } else {
      console.log('Success querying user_stats. Count:', statsCheck.rows[0].count);
    }

    await client.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

checkDb();
