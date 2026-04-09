#!/usr/bin/env node

/**
 * Safe dev server restart script
 *
 * Usage: node scripts/safe-restart-dev.js
 * Or add to package.json: "dev:restart": "node scripts/safe-restart-dev.js"
 *
 * This script:
 * 1. Kills any process on port 3000
 * 2. Waits 2 seconds for cleanup
 * 3. Clears Next.js cache
 * 4. Restarts npm run dev cleanly
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const PORT = 3000;
const WAIT_MS = 2000;

console.log('\n🔄 Safe Dev Server Restart');
console.log('═'.repeat(50));

// Step 1: Kill port 3000
console.log(`\n1️⃣  Killing any process on port ${PORT}...`);
try {
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows
    execSync(`netstat -ano | findstr :${PORT} && taskkill /PID <PID> /F`, { stdio: 'ignore' });
  } else {
    // macOS/Linux
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  }

  console.log(`   ✅ Port ${PORT} cleared`);
} catch (err) {
  console.log(`   ℹ️  Port was already free`);
}

// Step 2: Wait for cleanup
console.log(`\n2️⃣  Waiting ${WAIT_MS}ms for cleanup...`);
execSync(`node -e "setTimeout(() => {}, ${WAIT_MS})"`);
console.log(`   ✅ Cleanup complete`);

// Step 3: Clear Next.js cache
console.log(`\n3️⃣  Clearing Next.js cache...`);
try {
  execSync('rimraf .next', { stdio: 'ignore' });
  console.log(`   ✅ Cache cleared`);
} catch (err) {
  console.log(`   ℹ️  No cache to clear`);
}

// Step 4: Start dev server
console.log(`\n4️⃣  Starting dev server...\n`);
console.log('═'.repeat(50));

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: path.dirname(path.dirname(__filename))
});

child.on('exit', (code) => {
  process.exit(code);
});
