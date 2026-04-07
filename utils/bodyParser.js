/**
 * Body Parser Utility
 * Parses incoming JSON request bodies using native Node.js streams.
 * No external dependencies required.
 */

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw || raw.trim().length === 0) {
        return resolve({});
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { parseBody };
