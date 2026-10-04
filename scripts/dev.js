const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
require('./build-static.js');
const chat = require('../api/chat.js');
const output = path.resolve(__dirname, '../public');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.md': 'text/markdown' };

function error(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ error: message }));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/chat') {
      if (req.method === 'POST') {
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes <= 48 * 1024) chunks.push(chunk);
        }
        if (bytes > 48 * 1024) return error(res, 413, '请求内容过长。');
        req.body = Buffer.concat(chunks);
      }
      return await chat(req, res);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      return error(res, 405, '请求方法不支持。');
    }
    let relative;
    try { relative = decodeURIComponent(url.pathname.slice(1)) || 'index.html'; }
    catch { return error(res, 400, '网址无效。'); }
    const file = path.resolve(output, relative);
    if (!file.startsWith(output + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return error(res, 404, '页面不存在。');
    }
    res.writeHead(200, {
      'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file));
  } catch {
    if (!res.headersSent) error(res, 500, '本地预览暂时无法处理请求。');
    else res.end();
  }
});
server.requestTimeout = 45000;
module.exports = server;
if (require.main === module) {
  server.listen(8768, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:8768'));
}
