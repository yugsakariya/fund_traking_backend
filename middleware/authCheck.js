/**
 * Auth Middleware
 * Extracts JWT from Authorization header, verifies it,
 * checks the jti against the user_sessions DB table,
 * and attaches user info to the request object.
 */

const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Verifies JWT and ensures the session (jti) is still valid in DB.
 * Attaches req.user = { id, email, name, role, jti }
 */
async function authCheck(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, status: 401, message: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the session jti exists in user_sessions
    const sessionResult = await pool.query(
      'SELECT us.id, u.id AS user_id, u.name, u.email, u.role FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE us.jti = $1',
      [decoded.jti]
    );

    if (sessionResult.rows.length === 0) {
      return { authenticated: false, status: 401, message: 'Session expired or invalidated' };
    }

    const user = sessionResult.rows[0];
    return {
      authenticated: true,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        jti: decoded.jti,
      },
    };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { authenticated: false, status: 401, message: 'Token expired' };
    }
    return { authenticated: false, status: 401, message: 'Invalid token' };
  }
}

/**
 * Checks if the authenticated user has the required role.
 */
function roleCheck(user, requiredRole) {
  if (!user) return false;
  if (requiredRole === 'admin') return user.role === 'admin';
  return true; // 'member' role — any authenticated user
}

module.exports = { authCheck, roleCheck };
