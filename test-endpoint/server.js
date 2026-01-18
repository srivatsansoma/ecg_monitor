import http from 'http';

const PORT = process.env.PORT || 4000;

const recentPayloads = [];
const MAX_RECENT = 50;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.url === '/recent' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', items: recentPayloads }));
    return;
  }

  if (req.url === '/ingest' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      let payload = null;
      try {
        payload = body ? JSON.parse(body) : null;
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
        return;
      }

      const entry = { receivedAt: new Date().toISOString(), payload };
      recentPayloads.unshift(entry);
      if (recentPayloads.length > MAX_RECENT) {
        recentPayloads.pop();
      }
      console.log('Received payload:', payload);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'received',
          receivedAt: entry.receivedAt,
          payload,
        })
      );
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`Test endpoint running at http://localhost:${PORT}`);
  console.log('Health check:  GET /health');
  console.log('Ingest data:   POST /ingest');
});
