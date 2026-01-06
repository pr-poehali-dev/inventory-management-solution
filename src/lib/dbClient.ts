// Клиент для работы с PostgreSQL через poehali.dev API
const DB_API_URL = 'https://api.poehali.dev/db/query';

interface DbQueryResult {
  rows: any[];
  rowCount: number;
}

class DbClient {
  async query(sql: string, params?: any[]): Promise<DbQueryResult> {
    try {
      const response = await fetch(DB_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Database client error:', error);
      throw error;
    }
  }
}

let client: DbClient | null = null;

export function getDbClient(): DbClient {
  if (!client) {
    client = new DbClient();
  }
  return client;
}
