// Прямая работа с PostgreSQL через backend
const DB_QUERY_URL = 'https://functions.poehali.dev/390a9a7a-3d45-4867-a2a3-b9b364f2e2f7';

// Универсальная функция для выполнения SQL-запросов через backend
async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const response = await fetch(DB_QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Database error: ${response.status}`);
  }
  
  return response.json();
}

const SCHEMA = 't_p72562668_inventory_management';

// СПРАВОЧНИКИ
export async function getDirectoryItems(type: string) {
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

  const sql = `SELECT * FROM ${SCHEMA}.${tableName} ORDER BY id DESC LIMIT 100`;
  const result = await executeQuery(sql);
  return result.rows || [];
}

export async function createDirectoryItem(type: string, data: Record<string, any>) {
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
  if (!tableName) throw new Error('Invalid directory type');

  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    INSERT INTO ${SCHEMA}.${tableName} (${fields.join(', ')})
    VALUES (${placeholders})
    RETURNING id
  `;

  const result = await executeQuery(sql, values);
  return result.rows[0]?.id;
}

export async function updateDirectoryItem(type: string, id: number, data: Record<string, any>) {
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
  if (!tableName) throw new Error('Invalid directory type');

  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const sql = `
    UPDATE ${SCHEMA}.${tableName}
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${fields.length + 1}
  `;

  await executeQuery(sql, [...values, id]);
  return true;
}

export async function deleteDirectoryItem(type: string, id: number) {
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
  if (!tableName) throw new Error('Invalid directory type');

  const sql = `DELETE FROM ${SCHEMA}.${tableName} WHERE id = $1`;
  await executeQuery(sql, [id]);
  return true;
}

// ЗАКАЗЫ
export async function getOrders(statusFilter?: string) {
  let sql = `
    SELECT o.id, o.order_number, o.status, o.created_at, o.estimated_price,
           c.surname || ' ' || c.name as contractor_name,
           o.phone,
           COALESCE(db.name || ' ' || dm.name, '') as device
    FROM ${SCHEMA}.orders o
    LEFT JOIN ${SCHEMA}.contractors c ON o.contractor_id = c.id
    LEFT JOIN ${SCHEMA}.device_brands db ON o.brand_id = db.id
    LEFT JOIN ${SCHEMA}.device_models dm ON o.model_id = dm.id
  `;

  if (statusFilter && statusFilter !== 'all') {
    sql += ` WHERE o.status = '${statusFilter}'`;
  }

  sql += ' ORDER BY o.created_at DESC LIMIT 100';

  const result = await executeQuery(sql);
  return result.rows || [];
}

export async function getOrderById(id: number) {
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

  const result = await executeQuery(sql, [id]);
  return result.rows[0] || null;
}

export async function updateOrder(id: number, data: Record<string, any>) {
  const fields = Object.keys(data).filter(k => k !== 'items');
  const values = fields.map(k => data[k]);
  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

  const sql = `
    UPDATE ${SCHEMA}.orders
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${fields.length + 1}
  `;

  await executeQuery(sql, [...values, id]);
  
  // Обновляем позиции заказа если есть
  if (data.items && Array.isArray(data.items)) {
    await saveOrderItems(id, data.items);
  }
  
  return true;
}

export async function deleteOrder(id: number) {
  await executeQuery(`DELETE FROM ${SCHEMA}.order_accessories WHERE order_id = $1`, [id]);
  await executeQuery(`DELETE FROM ${SCHEMA}.order_items WHERE order_id = $1`, [id]);
  await executeQuery(`DELETE FROM ${SCHEMA}.order_history WHERE order_id = $1`, [id]);
  await executeQuery(`DELETE FROM ${SCHEMA}.orders WHERE id = $1`, [id]);
  return true;
}

// СТАТУСЫ
export async function getStatuses() {
  const sql = `SELECT * FROM ${SCHEMA}.order_statuses WHERE is_active = true ORDER BY sort_order`;
  const result = await executeQuery(sql);
  return result.rows || [];
}

// ИСТОРИЯ ЗАКАЗА
export async function getOrderHistory(orderId: number) {
  const sql = `
    SELECT h.*, u.full_name as user_name
    FROM ${SCHEMA}.order_history h
    LEFT JOIN ${SCHEMA}.users u ON h.user_id = u.id
    WHERE h.order_id = $1
    ORDER BY h.created_at DESC
  `;
  const result = await executeQuery(sql, [orderId]);
  return result.rows || [];
}

export async function addOrderHistory(orderId: number, actionType: string, description: string) {
  const sql = `
    INSERT INTO ${SCHEMA}.order_history (order_id, action_type, description)
    VALUES ($1, $2, $3)
  `;
  await executeQuery(sql, [orderId, actionType, description]);
  return true;
}

// ПОЗИЦИИ ЗАКАЗА
export async function getOrderItems(orderId: number) {
  const sql = `SELECT * FROM ${SCHEMA}.order_items WHERE order_id = $1 ORDER BY created_at`;
  const result = await executeQuery(sql, [orderId]);
  return result.rows || [];
}

export async function saveOrderItems(orderId: number, items: any[]) {
  await executeQuery(`DELETE FROM ${SCHEMA}.order_items WHERE order_id = $1`, [orderId]);

  for (const item of items) {
    await executeQuery(
      `INSERT INTO ${SCHEMA}.order_items (order_id, item_type, item_id, item_name, quantity, price, warranty_months, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [orderId, item.item_type, item.item_id, item.item_name, item.quantity, item.price, item.warranty_months || 0, item.total]
    );
  }
  
  return true;
}