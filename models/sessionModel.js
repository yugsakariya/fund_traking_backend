/**
 * Session Model - Raw SQL queries for user session (stateful JWT) operations
 */

const pool = require('../db');

const SessionModel = {
  async create(userId, jti) {
    const result = await pool.query(
      'INSERT INTO user_sessions (user_id, jti) VALUES ($1, $2) RETURNING *',
      [userId, jti]
    );
    return result.rows[0];
  },

  async findByJti(jti) {
    const result = await pool.query('SELECT * FROM user_sessions WHERE jti = $1', [jti]);
    return result.rows[0] || null;
  },

  async deleteByJti(jti) {
    await pool.query('DELETE FROM user_sessions WHERE jti = $1', [jti]);
  },

  async deleteAllForUser(userId) {
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
  },
};

module.exports = SessionModel;
