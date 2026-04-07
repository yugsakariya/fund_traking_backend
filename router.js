/**
 * Router
 * Maps HTTP methods and URL paths to controller actions.
 * No Express — pure pattern matching on the URL.
 */

const {parseBody} = require("./utils/bodyParser");
const {authCheck, roleCheck} = require("./middleware/authCheck");
const authController = require("./controllers/authController");
const fundController = require("./controllers/fundController");

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {"Content-Type": "application/json"});
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method.toUpperCase();
  console.log(
    `[ROUTER] Incoming request: ${method} '${path}' (original req.url: '${req.url}')`,
  );

  try {
    // ===== PUBLIC ROUTES =====

    // POST /api/auth/login
    if (method === "POST" && path === "/api/auth/login") {
      const body = await parseBody(req);
      const result = await authController.login(body);
      return sendJSON(res, result.status, result.data);
    }

    // POST /api/auth/register
    if (method === "POST" && path === "/api/auth/register") {
      const body = await parseBody(req);
      const result = await authController.register(body);
      return sendJSON(res, result.status, result.data);
    }

    // ===== PROTECTED ROUTES (require auth) =====

    const auth = await authCheck(req);
    if (!auth.authenticated) {
      return sendJSON(res, auth.status, {error: auth.message});
    }
    const user = auth.user;

    // POST /api/auth/logout
    if (method === "POST" && path === "/api/auth/logout") {
      const result = await authController.logout(user);
      return sendJSON(res, result.status, result.data);
    }

    // GET /api/auth/profile
    if (method === "GET" && path === "/api/auth/profile") {
      const result = await authController.getProfile(user);
      return sendJSON(res, result.status, result.data);
    }

    // GET /api/members
    if (method === "GET" && path === "/api/members") {
      const result = await authController.getMembers();
      return sendJSON(res, result.status, result.data);
    }

    // GET /api/fund/ledger
    if (method === "GET" && path === "/api/fund/ledger") {
      const result = await fundController.getLedger();
      return sendJSON(res, result.status, result.data);
    }

    // GET /api/fund/balance
    if (method === "GET" && path === "/api/fund/balance") {
      const result = await fundController.getBalance();
      return sendJSON(res, result.status, result.data);
    }

    // ===== ADMIN-ONLY ROUTES =====

    // POST /api/fund/transaction
    if (method === "POST" && path === "/api/fund/transaction") {
      if (!roleCheck(user, "admin")) {
        return sendJSON(res, 403, {error: "Admin access required"});
      }
      const body = await parseBody(req);
      const result = await fundController.addTransaction(body, user);
      return sendJSON(res, result.status, result.data);
    }

    // 404 Not Found
    return sendJSON(res, 404, {error: "Route not found"});
  } catch (err) {
    console.error("Router error:", err);
    return sendJSON(res, 500, {error: "Internal server error"});
  }
}

module.exports = {handleRequest};
