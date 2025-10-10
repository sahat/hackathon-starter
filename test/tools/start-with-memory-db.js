#!/usr/bin/env node
// test/helpers/start-with-memory-db.js
// Starts mongodb-memory-server and then starts the app (require('../../app')).

const path = require('path');
const { spawnSync } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async function main() {
  try {
    // If a real MONGODB_URI is already provided, prefer it.
    if (process.env.MONGODB_URI) {
      console.log('[start-with-memory-db] Using provided MONGODB_URI');
    } else {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      process.env.MONGODB_URI = uri;
      // expose a flag so we can stop it if needed in advanced setups
      process.env.__MONGO_MEMORY_SERVER_RUNNING = '1';
      console.log('[start-with-memory-db] Started MongoMemoryServer at', uri);

      // stop on exit
      const stop = async () => {
        try {
          await mongod.stop();
          console.log('[start-with-memory-db] MongoMemoryServer stopped');
        } catch (e) {
          console.error('[start-with-memory-db] Error stopping MongoMemoryServer', e);
        }
        process.exit(0);
      };

      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);
      process.on('exit', stop);
    }

    // Ensure BASE_URL and PORT are set for the app
    process.env.PORT = process.env.PORT || '8080';
    process.env.BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;

    // If scss build is necessary before starting the app (like npm start does), run it synchronously
    try {
      console.log('[start-with-memory-db] Building scss...');
      spawnSync('npm', ['run', 'scss'], { stdio: 'inherit' });
    } catch (e) {
      console.warn('[start-with-memory-db] SCSS build failed or not available:', e.message || e);
    }

    // Import the application after env is set so app.js picks up MONGODB_URI
    const urlMod = await import('url');
    const { pathToFileURL } = urlMod;
    const appPath = path.join(__dirname, '..', '..', 'app.js');
    await import(pathToFileURL(appPath).href);
    // keep process alive; app.listen is called inside app.js
  } catch (err) {
    console.error('[start-with-memory-db] Error starting:', err);
    process.exit(1);
  }
})();
