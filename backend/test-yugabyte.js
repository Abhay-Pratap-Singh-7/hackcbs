const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const caPath = process.env.DB_CA_CERT_PATH 
  ? path.resolve(__dirname, process.env.DB_CA_CERT_PATH)
  : path.resolve(__dirname, 'root.crt');

console.log('[YugabyteDB Test] Checking CA cert at:', caPath);
if (!fs.existsSync(caPath)) {
  console.error('[YugabyteDB Test] ERROR: CA cert not found at:', caPath);
  process.exit(1);
}

const caCert = fs.readFileSync(caPath).toString();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: caCert
  }
});

async function run() {
  console.log('[YugabyteDB Test] Connecting to cluster...');
  try {
    await client.connect();
    console.log('[YugabyteDB Test] SUCCESS: Connected to YugabyteDB!');

    const res = await client.query('SELECT version(), current_database(), current_user, now();');
    console.log('[YugabyteDB Test] Database info:');
    console.log(' - Current Database:', res.rows[0].current_database);
    console.log(' - Current User:', res.rows[0].current_user);
    console.log(' - Current Time:', res.rows[0].now);
    console.log(' - Version:', res.rows[0].version.split('\n')[0]);

    // Check existing tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n[YugabyteDB Test] Public tables count:', tablesRes.rows.length);
    if (tablesRes.rows.length > 0) {
      console.log(' - Tables:', tablesRes.rows.map(r => r.table_name).join(', '));
    } else {
      console.log(' - (No tables found in public schema)');
    }

    await client.end();
    console.log('\n[YugabyteDB Test] Connection test completed successfully!');
  } catch (err) {
    console.error('\n[YugabyteDB Test] Connection FAILED:');
    console.error(err);
    process.exit(1);
  }
}

run();
