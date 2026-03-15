#!/usr/bin/env node

/**
 * Sync environment variables from .env.local to Vercel
 * Reads Upstash and other credentials and pushes them to Vercel
 */

const https = require('https');
const fs = require('fs');

function httpsRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('\n🔄 Syncing environment variables to Vercel...\n');

  // Read .env.local
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1]] = match[2];
  });

  const vercelToken = envVars.AUTH_BEARER_TOKEN;
  const vercelProject = envVars.VERCEL_PROJECT_ID;

  if (!vercelToken || !vercelProject) {
    console.error('❌ Missing Vercel credentials in .env.local');
    process.exit(1);
  }

  // Variables to sync
  const toSync = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  for (const key of toSync) {
    const value = envVars[key];
    if (!value) {
      console.log(`⏭  ${key} not found in .env.local, skipping`);
      continue;
    }

    process.stdout.write(`Setting ${key}... `);

    try {
      const result = await httpsRequest({
        hostname: 'api.vercel.com',
        path: `/v10/projects/${vercelProject}/env`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        }
      }, {
        type: 'encrypted',
        key,
        value,
        target: ['production', 'preview', 'development']
      });

      if (result.status === 200 || result.data?.id) {
        console.log('✅');
      } else if (result.data?.error?.code === 'ENV_CONFLICT') {
        console.log('⚠️  (already exists, updating...)');

        // Try to update instead
        // First get the env var ID
        const getResult = await httpsRequest({
          hostname: 'api.vercel.com',
          path: `/v9/projects/${vercelProject}/env`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          }
        });

        const existing = getResult.data?.envs?.find(e => e.key === key);
        if (existing) {
          await httpsRequest({
            hostname: 'api.vercel.com',
            path: `/v9/projects/${vercelProject}/env/${existing.id}`,
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            }
          }, { value });
          console.log('  ✅ Updated');
        }
      } else {
        console.log(`❌ ${result.data?.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log('\n✅ Sync complete!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
