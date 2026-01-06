import { getDbClient } from '@/lib/dbClient';

const SCHEMA = 't_p72562668_inventory_management';

export interface QueryResult<T = any> {
  rows: T[];
  error?: string;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
  try {
    const client = getDbClient();
    const result = await client.query(sql, params);
    return { rows: result.rows };
  } catch (error) {
    console.error('Database query error:', error);
    return { rows: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Справочники
export async function getDirectoryItems(type: string): Promise<any[]> {
  const tableMap: Record<string, string> = {
    contractors: 'contractors',
    products: 'products',
    services: 'services',
    devices: 'device_types',
    accessories: 'accessories',
    malfunctions: 'malfunctions',
    units: 'units',
    money: 'money_items',
    users: 'users',
  };

  const tableName = tableMap[type];
  if (!tableName) return [];

  const result = await query(`SELECT * FROM ${SCHEMA}.${tableName} ORDER BY id DESC LIMIT 100`);
  return result.rows;
}

export async function createDirectoryItem(type: string, data: Record<string, any>): Promise<number | null> {
  const tableMap: Record<string, string> = {
    contractors: 'contractors',
    products: 'products',
    services: 'services',
    devices: 'device_types',
    accessories: 'accessories',
    malfunctions: 'malfunctions',
    units: 'units',
    money: 'money_items',
  };

  const tableName = tableMap[type];
  if (!tableName) return null;

  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    INSERT INTO ${SCHEMA}.${tableName} (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING id
  `;

  const result = await query(sql, values);
  return result.rows[0]?.id || null;
}

export async function updateDirectoryItem(type: string, id: number, data: Record<string, any>): Promise<boolean> {
  const tableMap: Record<string, string> = {
    contractors: 'contractors',
    products: 'products',
    services: 'services',
    devices: 'device_types',
    accessories: 'accessories',
    malfunctions: 'malfunctions',
    units: 'units',
    money: 'money_items',
  };

  const tableName = tableMap[type];
  if (!tableName) return false;

  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const sql = `
    UPDATE ${SCHEMA}.${tableName}
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${fields.length + 1}
  `;

  const result = await query(sql, [...values, id]);
  return !result.error;
}

export async function deleteDirectoryItem(type: string, id: number): Promise<boolean> {
  const tableMap: Record<string, string> = {
    contractors: 'contractors',
    products: 'products',
    services: 'services',
    devices: 'device_types',
    accessories: 'accessories',
    malfunctions: 'malfunctions',
    units: 'units',
    money: 'money_items',
  };

  const tableName = tableMap[type];
  if (!tableName) return false;

  const sql = `DELETE FROM ${SCHEMA}.${tableName} WHERE id = $1`;
  const result = await query(sql, [id]);
  return !result.error;
}

// Заказы
export async function getOrders(statusFilter?: string): Promise<any[]> {
  let sql = `
    SELECT o.id, o.order_number, o.status, o.created_at, o.estimated_price,
           c.surname || ' ' || c.name as contractor_name,
           o.phone,
           db.name || ' ' || dm.name as device
    FROM ${SCHEMA}.orders o
    LEFT JOIN ${SCHEMA}.contractors c ON o.contractor_id = c.id
    LEFT JOIN ${SCHEMA}.device_brands db ON o.brand_id = db.id
    LEFT JOIN ${SCHEMA}.device_models dm ON o.model_id = dm.id
  `;

  if (statusFilter && statusFilter !== 'all') {
    sql += ` WHERE o.status = '${statusFilter}'`;
  }

  sql += ' ORDER BY o.created_at DESC LIMIT 100';

  const result = await query(sql);
  return result.rows;
}

export async function getOrderById(id: number): Promise<any | null> {
  const sql = `
    SELECT o.*, 
           c.surname || ' ' || c.name || ' ' || COALESCE(c.patronymic, '') as contractor_name,
           dt.name as device_type_name,
           db.name as brand_name,
           dm.name as model_name
    FROM ${SCHEMA}.orders o
    LEFT JOIN ${SCHEMA}.contractors c ON o.contractor_id = c.id
    LEFT JOIN ${SCHEMA}.device_types dt ON o.device_type_id = dt.id
    LEFT JOIN ${SCHEMA}.device_brands db ON o.brand_id = db.id
    LEFT JOIN ${SCHEMA}.device_models dm ON o.model_id = dm.id
    WHERE o.id = $1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function deleteOrder(id: number): Promise<boolean> {
  try {
    await query(`DELETE FROM ${SCHEMA}.order_accessories WHERE order_id = $1`, [id]);
    await query(`DELETE FROM ${SCHEMA}.order_items WHERE order_id = $1`, [id]);
    await query(`DELETE FROM ${SCHEMA}.order_history WHERE order_id = $1`, [id]);
    await query(`DELETE FROM ${SCHEMA}.orders WHERE id = $1`, [id]);
    return true;
  } catch (error) {
    return false;
  }
}

// Статусы
export async function getStatuses(): Promise<any[]> {
  const result = await query(`SELECT * FROM ${SCHEMA}.order_statuses WHERE is_active = true ORDER BY sort_order`);
  return result.rows;
}

// История заказа
export async function getOrderHistory(orderId: number): Promise<any[]> {
  const sql = `
    SELECT h.*, u.full_name as user_name
    FROM ${SCHEMA}.order_history h
    LEFT JOIN ${SCHEMA}.users u ON h.user_id = u.id
    WHERE h.order_id = $1
    ORDER BY h.created_at DESC
  `;
  const result = await query(sql, [orderId]);
  return result.rows;
}

export async function addOrderHistory(orderId: number, actionType: string, description: string): Promise<boolean> {
  const sql = `
    INSERT INTO ${SCHEMA}.order_history (order_id, action_type, description)
    VALUES ($1, $2, $3)
  `;
  const result = await query(sql, [orderId, actionType, description]);
  return !result.error;
}

// Позиции заказа
export async function getOrderItems(orderId: number): Promise<any[]> {
  const sql = `SELECT * FROM ${SCHEMA}.order_items WHERE order_id = $1 ORDER BY created_at`;
  const result = await query(sql, [orderId]);
  return result.rows;
}

export async function saveOrderItems(orderId: number, items: any[]): Promise<boolean> {
  try {
    await query(`DELETE FROM ${SCHEMA}.order_items WHERE order_id = $1`, [orderId]);

    for (const item of items) {
      await query(
        `INSERT INTO ${SCHEMA}.order_items (order_id, item_type, item_id, item_name, quantity, price, warranty_months, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.item_type, item.item_id, item.item_name, item.quantity, item.price, item.warranty_months, item.total]
      );
    }
    return true;
  } catch (error) {
    return false;
  }
}
