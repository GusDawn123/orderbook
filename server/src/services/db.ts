import { Pool, QueryResult } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL })
  : null;

const DB_ENABLED = !!pool;

async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  if (!pool) {
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  }
  return pool.query(text, params);
}

export async function insertTrade(
  bidOrderId: number,
  askOrderId: number,
  price: number,
  quantity: number,
) {
  if (!DB_ENABLED) return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  return query(
    'INSERT INTO trades (bid_order_id, ask_order_id, price, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
    [bidOrderId, askOrderId, price, quantity],
  );
}

export async function insertOrder(
  orderId: number,
  orderType: string,
  side: string,
  price: number,
  quantity: number,
) {
  if (!DB_ENABLED) return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  return query(
    `INSERT INTO orders (order_id, order_type, side, price, quantity, remaining, status)
     VALUES ($1, $2, $3, $4, $5, $5, 'active') RETURNING *`,
    [orderId, orderType, side, price, quantity],
  );
}

export async function updateOrderStatus(orderId: number, status: string, remaining?: number) {
  if (!DB_ENABLED) return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  if (remaining !== undefined) {
    return query(
      'UPDATE orders SET status = $1, remaining = $2, updated_at = NOW() WHERE order_id = $3',
      [status, remaining, orderId],
    );
  }
  return query(
    'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2',
    [status, orderId],
  );
}

export async function getRecentTrades(limit: number = 50) {
  return query('SELECT * FROM trades ORDER BY executed_at DESC LIMIT $1', [limit]);
}

export async function getActiveOrders() {
  return query("SELECT * FROM orders WHERE status = 'active' ORDER BY created_at DESC");
}

export { pool };
