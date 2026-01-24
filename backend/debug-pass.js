const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'password',
    database: 'erankup_db',
});

async function run() {
    await client.connect();
    try {
        const userRes = await client.query(`
      SELECT u.email, up.status, up."purchaseDate", up."expiryDate", p.title, up."razorpayOrderId"
      FROM "user" u 
      LEFT JOIN user_pass up ON u.id = up."userId" 
      LEFT JOIN pass p ON up."passId" = p.id
      WHERE u.email = 'sivadadi114@gmail.com'
      ORDER BY up."createdAt" DESC;
    `);
        console.log('User Pass Records:', userRes.rows);
    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
