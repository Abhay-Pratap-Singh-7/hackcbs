const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

const getYugabytePool = () => {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[YugabyteDB Warning]: DATABASE_URL is not set in .env.');
    return null;
  }

  // Resolve CA certificate
  let ssl = false;
  const caRelPath = process.env.DB_CA_CERT_PATH || 'root.crt';
  const possiblePaths = [
    path.resolve(process.cwd(), caRelPath),
    path.resolve(__dirname, '../../', caRelPath),
    path.resolve(__dirname, '../', caRelPath),
    path.resolve(__dirname, '../../root.crt'),
    path.resolve(__dirname, '../../../root.crt')
  ];

  let resolvedCa = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      resolvedCa = p;
      break;
    }
  }

  if (resolvedCa) {
    ssl = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(resolvedCa).toString()
    };
  } else {
    // If no CA found, fallback to require SSL without custom CA if hosted
    ssl = { rejectUnauthorized: false };
  }

  pool = new Pool({
    connectionString,
    ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  pool.on('error', (err) => {
    console.error('[YugabyteDB Unexpected Pool Error]:', err.message);
  });

  return pool;
};

const connectYugabyte = async () => {
  const p = getYugabytePool();
  if (!p) return null;

  try {
    const client = await p.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log(`[YugabyteDB Connected]: Database "${res.rows[0].current_database}" as user "${res.rows[0].current_user}"`);
    client.release();
    return true;
  } catch (err) {
    console.error(`[YugabyteDB Connection Warning]: ${err.message}`);
    return false;
  }
};

const query = async (text, params) => {
  const p = getYugabytePool();
  if (!p) throw new Error('YugabyteDB pool not initialized. Check DATABASE_URL in .env');
  return p.query(text, params);
};

module.exports = {
  getYugabytePool,
  connectYugabyte,
  query
};
