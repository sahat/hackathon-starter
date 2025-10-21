// tools/start-and-log.js
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const logPath = path.resolve(__dirname, '../..', 'tmp', 'playwright-webserver.log');
const out = fs.createWriteStream(logPath, { flags: 'w' });

// Spawn the real server using the same node executable
const child = spawn(process.execPath, [path.join(__dirname, 'start-with-memory-db.js')], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
});

// Pipe both stdout and stderr to console and to the file
child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  out.write(chunk);
});
child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  out.write(chunk);
});

// Forward exit code when child exits
child.on('close', (code) => {
  out.end();
  process.exit(code);
});

// Ensure parent dies if child dies unexpectedly
child.on('error', (err) => {
  console.error('Failed to start child process:', err);
  out.end();
  process.exit(1);
});
