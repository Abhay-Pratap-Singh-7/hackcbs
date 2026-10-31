const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { pool, connectYugabyte } = require('./yugabyte');

async function initSchema() {
  console.log('[YugabyteDB Init]: Connecting to cluster...');
  const connected = await connectYugabyte();
  if (!connected) {
    console.error('[YugabyteDB Init Failed]: Could not connect to cluster. Exiting.');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(sqlPath, 'utf8');

  console.log('[YugabyteDB Init]: Running schema migrations...');
  try {
    await pool.query(schemaSql);
    console.log('[YugabyteDB Init]: Schema initialized successfully!');
    
    // Check tables
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('[YugabyteDB Init]: Tables created in public schema:');
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));
  } catch (err) {
    console.error('[YugabyteDB Init Error]:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initSchema();
}

module.exports = initSchema;

