/**
 * Auth Controller
 * Handles Login, Register, Logout, and profile retrieval.
 * Uses native crypto.scrypt for password hashing and crypto.randomUUID() for jti.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const SessionModel = require('../models/sessionModel');
const TransactionModel = require('../models/transactionModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = '7d';

// --- Password hashing helpers using native crypto ---

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}

// --- Controller handlers ---

async function login(body) {
  const { email, password } = body;

  if (!email || !password) {
    return { status: 400, data: { error: 'Email and password are required' } };
  }

  const user = await UserModel.findByEmail(email.toLowerCase().trim());
  if (!user) {
    return { status: 401, data: { error: 'Invalid email or password' } };
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return { status: 401, data: { error: 'Invalid email or password' } };
  }

  // Generate a unique jti for this session
  const jti = crypto.randomUUID();

  // Store the session in DB
  await SessionModel.create(user.id, jti);

  // Sign the JWT with jti
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    status: 200,
    data: {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  };
}

async function register(body) {
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return { status: 400, data: { error: 'Name, email, and password are required' } };
  }

  // Check if user exists
  const existing = await UserModel.findByEmail(email.toLowerCase().trim());
  if (existing) {
    return { status: 409, data: { error: 'Email already registered' } };
  }

  const passwordHash = await hashPassword(password);
  const userRole = role === 'admin' ? 'admin' : 'member';

  const user = await UserModel.create(name.trim(), email.toLowerCase().trim(), passwordHash, userRole);

  return {
    status: 201,
    data: {
      message: 'User registered successfully',
      user,
    },
  };
}

async function logout(user) {
  // Delete the session (jti) from DB
  await SessionModel.deleteByJti(user.jti);
  return { status: 200, data: { message: 'Logged out successfully' } };
}

async function getProfile(user) {
  const profile = await UserModel.findById(user.id);
  if (!profile) {
    return { status: 404, data: { error: 'User not found' } };
  }

  // Fetch the user's full transaction ledger and personal totals
  const [transactions, totals] = await Promise.all([
    TransactionModel.getByUserId(user.id),
    TransactionModel.getTotalsByUserId(user.id),
  ]);

  return {
    status: 200,
    data: {
      user: profile,
      ledger: transactions,
      summary: {
        total_deposits: parseFloat(totals.total_deposits),
        total_withdrawals: parseFloat(totals.total_withdrawals),
        net_contribution: parseFloat(totals.net_contribution),
      },
    },
  };
}

async function getMembers() {
  const users = await UserModel.getAll();
  return { status: 200, data: { users } };
}

module.exports = { login, register, logout, getProfile, getMembers, hashPassword };
