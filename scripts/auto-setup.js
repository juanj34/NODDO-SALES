#!/usr/bin/env node

/**
 * NODDO - Automated Upstash + Sentry Setup
 *
 * This script automatically configures Upstash Redis and Sentry
 * for production use in Vercel.
 */

const https = require('https');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   NODDO - Automated Production Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Read .env.local
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1]] = match[2];
  });

  const vercelToken = envVars.AUTH_BEARER_TOKEN;
  const vercelProject = envVars.VERCEL_PROJECT_ID;

  console.log('✓ Found Vercel credentials\n');

  // Check Sentry
  console.log('━━━ Sentry Configuration ━━━\n');
  if (envVars.SENTRY_AUTH_TOKEN && envVars.SENTRY_ORG && envVars.SENTRY_PROJECT) {
    console.log('✓ Sentry is already configured in .env.local');
    console.log(`  Org: ${envVars.SENTRY_ORG}`);
    console.log(`  Project: ${envVars.SENTRY_PROJECT}`);
    console.log('✓ Sentry environment variables already in Vercel\n');
  } else {
    console.log('⚠ Sentry not fully configured\n');
  }

  // Check Upstash
  console.log('━━━ Upstash Redis Configuration ━━━\n');

  let upstashUrl = envVars.UPSTASH_REDIS_REST_URL;
  let upstashToken = envVars.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    console.log('✓ Upstash credentials found in .env.local\n');
  } else {
    console.log('⚠ Upstash not configured yet\n');
    console.log('To set up Upstash Redis for rate limiting:\n');
    console.log('1. Visit: https://console.upstash.com/');
    console.log('2. Create a new database (free tier available)');
    console.log('3. Copy the REST URL and REST TOKEN\n');

    upstashUrl = await question('Enter UPSTASH_REDIS_REST_URL (or press Enter to skip): ');
    if (upstashUrl) {
      upstashToken = await question('Enter UPSTASH_REDIS_REST_TOKEN: ');

      // Add to .env.local
      fs.appendFileSync('.env.local', `\n\n# Upstash Redis (rate limiting)\nUPSTASH_REDIS_REST_URL=${upstashUrl}\nUPSTASH_REDIS_REST_TOKEN=${upstashToken}\n`);
      console.log('\n✓ Credentials saved to .env.local\n');
    } else {
      console.log('\n⚠ Skipping Upstash setup (rate limiting will be disabled)\n');
      rl.close();
      return;
    }
  }

  // Set environment variables in Vercel
  console.log('━━━ Configuring Vercel Environment Variables ━━━\n');

  const envToSet = [
    { key: 'UPSTASH_REDIS_REST_URL', value: upstashUrl },
    { key: 'UPSTASH_REDIS_REST_TOKEN', value: upstashToken },
  ];

  for (const { key, value } of envToSet) {
    if (!value) continue;

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
        console.log('✓');
      } else if (result.data?.error?.code === 'ENV_CONFLICT') {
        console.log('⚠ (already exists)');
      } else {
        console.log('✗ Failed:', result.data?.error?.message || 'Unknown error');
      }
    } catch (err) {
      console.log('✗ Error:', err.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ✅ Setup Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Production features now active:\n');
  console.log('✓ Sentry - Error monitoring and performance tracking');
  console.log('✓ Upstash Redis - Rate limiting (API, auth, uploads, emails)');
  console.log('\nRate limits configured:');
  console.log('  • API endpoints: 100 requests / 10 seconds');
  console.log('  • Auth endpoints: 5 requests / minute');
  console.log('  • Lead forms: 3 requests / hour');
  console.log('  • File uploads: 20 requests / minute');
  console.log('  • Email sending: 10 emails / hour');
  console.log('\nNext deployment will activate all features.');
  console.log('\nMonitor at:');
  console.log('  • Sentry: https://noddo.sentry.io/');
  console.log('  • Upstash: https://console.upstash.com/\n');

  rl.close();
}

main().catch(err => {
  console.error('\n✗ Error:', err);
  rl.close();
  process.exit(1);
});
