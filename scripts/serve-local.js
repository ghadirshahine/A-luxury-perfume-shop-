'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const studioDist = path.join(root, 'dar-al-aumara', 'studio', 'dist');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isWithin(directory, file) {
  return file === directory || file.startsWith(`${directory}${path.sep}`);
}

function resolveRequest(pathname) {
  let base = root;
  let relativePath = pathname;

  if (pathname === '/') {
    relativePath = '/index.html';
  } else if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    base = studioDist;
    relativePath = pathname.slice('/studio'.length);
    if (!relativePath.startsWith('/static/') && !relativePath.startsWith('/vendor/')) {
      relativePath = '/index.html';
    }
  } else if (pathname === '/static' || pathname.startsWith('/static/')) {
    base = studioDist;
  } else if (pathname === '/vendor' || pathname.startsWith('/vendor/')) {
    base = studioDist;
  }

  let file = path.resolve(base, `.${relativePath}`);
  if (!isWithin(base, file)) return null;

  if (file === studioDist || file === path.join(studioDist, '')) {
    file = path.join(studioDist, 'index.html');
  }

  return {base, file};
}

http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, {Allow: 'GET, HEAD'});
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const resolved = resolveRequest(pathname);
  if (!resolved) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.stat(resolved.file, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentTypes[path.extname(resolved.file).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    fs.createReadStream(resolved.file).pipe(response);
  });
}).listen(8080, '127.0.0.1', () => {
  console.log(`Storefront: http://localhost:8080`);
  console.log(`Sanity Studio: http://localhost:8080/studio`);
});
