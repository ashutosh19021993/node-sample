const http = require('http');

const PORT = process.env.PORT || 3000;
let isShuttingDown = false;

const requestListener = (req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  if (req.url === '/readyz') {
    if (isShuttingDown) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      return res.end('shutting down');
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ready');
  }
  if (req.url === '/' || req.url.startsWith('/hello')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('Hello from Node on EKS via Argo CD!\n');
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
};

const server = http.createServer(requestListener);

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const shutdown = () => {
  isShuttingDown = true;
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(err => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
    console.log('Server closed. Bye!');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('Force exiting after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
