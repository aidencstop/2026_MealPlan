import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection test
pool.on('connect', () => {
  console.log('✅ PostgreSQL 연결 성공');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 에러:', err);
  process.exit(-1);
});

export default pool;
