const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');

/*
 * getFileHash function for use in pug templates for cache busting of frontend files
 * Computes a short content hash for a frontend file, used as a cache-busting query parameter (?v=HASH)
 * It also caches the computed hash on first use, so subsequent calls
 * for the same file skip the disk read and hash calculation
 */
const fileHashCache = new Map();

exports.getFileHash = (fileUrl, libFiles, rootDir) => {
  if (fileHashCache.has(fileUrl)) return fileHashCache.get(fileUrl);

  let filePath;
  if (libFiles.has(fileUrl)) {
    // was the file from public/ folder or from libFiles?
    filePath = libFiles.get(fileUrl);
  } else {
    filePath = path.join('public', fileUrl.slice(1));
  }

  const hash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(rootDir, filePath)))
    .digest('hex')
    .slice(0, 8);

  fileHashCache.set(fileUrl, hash);
  return hash;
};

// Reset the in-memory cache (useful in tests)
exports.clearCache = () => fileHashCache.clear();
