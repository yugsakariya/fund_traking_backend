/**
 * Server Entry Point
 * Pure vanilla Node.js HTTP server with CORS support.
 * No Express, no frameworks.
 */

const http = require('http');
require('dotenv').config();
const { handleRequest } = require('./router');

const PORT = parseInt(process.env.PORT) || 4000;
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

function setCORSHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Allow any origin in development
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

const server = http.createServer(async (req, res) => {
  setCORSHeaders(req, res);

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  await handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Fund Tracker API Server               ║
  ║   Running on http://localhost:${PORT}      ║
  ║   Press Ctrl+C to stop                  ║
  ╚══════════════════════════════════════════╝
  `);
});
