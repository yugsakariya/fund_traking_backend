/**
 * Transaction Model - Raw SQL queries for fund transactions
 */

const pool = require('../db');

const TransactionModel = {
  async create(userId, amount, type, note, recordedBy) {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, type, note, recorded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, amount, type, note, recordedBy]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.user_id,
        t.amount,
        t.type,
        t.note,
        t.recorded_by,
        t.created_at,
        u.name AS user_name,
        u.email AS user_email,
        r.name AS recorded_by_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN users r ON t.recorded_by = r.id
       ORDER BY t.created_at DESC`
    );
    return result.rows;
  },

  async getTotalBalance() {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) AS total_deposits,
        COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_withdrawals,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) AS balance
       FROM transactions`
    );
    return result.rows[0];
  },

  async getByUserId(userId) {
    const result = await pool.query(
      `SELECT 
        t.id, t.amount, t.type, t.note, t.created_at,
        u.name AS user_name,
        r.name AS recorded_by_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN users r ON t.recorded_by = r.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getTotalsByUserId(userId) {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) AS total_deposits,
        COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_withdrawals,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) AS net_contribution
       FROM transactions
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },
};

module.exports = TransactionModel;
