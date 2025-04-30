
import { Pool } from 'pg';

let pool: Pool;

if (!pool) {
  if (!process.env.POSTGRES_URL) {
    console.warn(
      'POSTGRES_URL environment variable is not set. Database connection will not be available.'
    );
    // Provide a dummy pool or throw an error depending on desired behavior when DB is unavailable
    pool = {
      query: async () => {
        throw new Error('Database connection is not configured.');
      },
      // Add other methods if needed, or use a more robust dummy implementation
    } as any; // Use 'as any' carefully, consider a more typed approach if possible
  } else {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.POSTGRES_URL.includes('localhost')
        ? false // Disable SSL for local connections
        : {
            rejectUnauthorized: false, // Adjust based on your SSL requirements
          },
    });
  }
}

export const db = pool;

// Optional: Add a helper function for executing queries
export async function query(text: string, params?: any[]) {
  if (!pool) {
     throw new Error('Database pool is not initialized. Check environment configuration.');
  }
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}
