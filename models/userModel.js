/**
 * User Model - Raw SQL queries for user operations
 */

const pool = require('../db');

const UserModel = {
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(name, email, passwordHash, role = 'member') {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role]
    );
    return result.rows[0];
  },

  async getAll() {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    return result.rows;
  },
};

module.exports = UserModel;
