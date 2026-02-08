const bcrypt = require("bcrypt");
const { Client } = require("pg");

async function updateAdmin() {
    // Check if seeding is enabled
    const shouldSeed = process.env.SEED_ADMIN === 'true';

    if (!shouldSeed) {
        console.log("SKIP: Admin update disabled (SEED_ADMIN is not 'true')");
        console.log("Set SEED_ADMIN=true in .env to enable admin seeding/updates");
        return;
    }

    const client = new Client({
        host: "postgres",
        port: 5432,
        user: process.env.DB_USER || "admin",
        password: process.env.DB_PASSWORD || "password",
        database: process.env.DB_NAME || "erankup_db",
    });

    await client.connect();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@erankup.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin exists
    const checkResult = await client.query('SELECT id FROM "user" WHERE email = $1', [adminEmail]);

    if (checkResult.rows.length === 0) {
        // Create admin
        await client.query(
            'INSERT INTO "user" (id, email, password, "fullName", role, "isActive", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())',
            [adminEmail, hashedPassword, 'System Admin', 'admin', true]
        );
        console.log("Admin user created:", adminEmail);
    } else {
        // Update password
        await client.query('UPDATE "user" SET password = $1 WHERE email = $2', [hashedPassword, adminEmail]);
        console.log("Admin password updated for:", adminEmail);
    }

    await client.end();
}

updateAdmin().catch(console.error);
