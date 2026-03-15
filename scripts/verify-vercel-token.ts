/**
 * Vercel Token Verification Script
 *
 * Verifies that the AUTH_BEARER_TOKEN has correct scopes for domain management.
 *
 * Usage:
 *   npx tsx scripts/verify-vercel-token.ts
 *
 * Or via npm script:
 *   npm run verify:vercel
 *
 * Required Environment Variables:
 *   - AUTH_BEARER_TOKEN: Vercel API token
 *   - VERCEL_PROJECT_ID: Vercel project ID (e.g., prj_xxxxxxxxxxxxx)
 *   - VERCEL_TEAM_ID: (Optional) Vercel team ID if project belongs to team
 */

const TOKEN = process.env.AUTH_BEARER_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!TOKEN) {
  console.error("❌ AUTH_BEARER_TOKEN not found in environment");
  console.error("   Set it in .env.local or Vercel dashboard");
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error("❌ VERCEL_PROJECT_ID not found in environment");
  console.error("   Find it in Vercel dashboard → Project Settings → General");
  process.exit(1);
}

const VERCEL_API = "https://api.vercel.com";
const teamParam = TEAM_ID ? `?teamId=${TEAM_ID}` : "";

function getHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function testUserInfo() {
  console.log("\n🔍 Test 1: Get User Info");
  try {
    const res = await fetch(`${VERCEL_API}/v2/user`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      console.error(`❌ Failed: ${res.status} ${res.statusText}`);
      if (res.status === 401) {
        console.error("   Token is invalid or expired");
      }
      return false;
    }

    const data = await res.json();
    console.log(`✅ Success: Logged in as ${data.user.email}`);
    console.log(`   User ID: ${data.user.id}`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function testListDomains() {
  console.log("\n🔍 Test 2: List Project Domains (domains:read scope)");
  try {
    const res = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains${teamParam}`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      if (res.status === 403) {
        console.error("❌ Failed: 403 Forbidden");
        console.error("   Possible causes:");
        console.error("   - Token lacks domains:read scope");
        console.error("   - VERCEL_PROJECT_ID is incorrect");
        console.error("   - Token doesn't belong to project owner/team");
        return false;
      }
      if (res.status === 404) {
        console.error("❌ Failed: 404 Not Found");
        console.error("   VERCEL_PROJECT_ID is incorrect");
        return false;
      }
      console.error(`❌ Failed: ${res.status} ${res.statusText}`);
      return false;
    }

    const data = await res.json();
    console.log(`✅ Success: Found ${data.domains.length} domain(s)`);
    if (data.domains.length > 0) {
      console.log(`   Domains:`);
      data.domains.slice(0, 5).forEach((d: { name: string; verified: boolean }) => {
        const status = d.verified ? "✓" : "✗";
        console.log(`     ${status} ${d.name}`);
      });
      if (data.domains.length > 5) {
        console.log(`     ... and ${data.domains.length - 5} more`);
      }
    }
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function testAddDomain() {
  console.log("\n🔍 Test 3: Add Test Domain (domains:write scope)");
  const testDomain = `test-${Date.now()}.example.com`;

  try {
    const res = await fetch(
      `${VERCEL_API}/v10/projects/${PROJECT_ID}/domains${teamParam}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: testDomain }),
      }
    );

    if (!res.ok) {
      if (res.status === 403) {
        console.error("❌ Failed: 403 Forbidden");
        console.error("   ⚠️ CRITICAL: Token lacks domains:write scope");
        console.error("   Custom domains WILL NOT WORK in production!");
        return false;
      }
      console.error(`❌ Failed: ${res.status} ${res.statusText}`);
      try {
        const errorData = await res.json();
        console.error(`   Error: ${JSON.stringify(errorData, null, 2)}`);
      } catch {
        // Ignore JSON parse errors
      }
      return false;
    }

    console.log(`✅ Success: Added test domain ${testDomain}`);

    // Clean up — delete the test domain
    console.log(`   Cleaning up...`);
    const deleteRes = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains/${testDomain}${teamParam}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (deleteRes.ok) {
      console.log(`   ✅ Test domain deleted`);
    } else {
      console.warn(
        `   ⚠️ Could not delete test domain ${testDomain}`,
      );
      console.warn(
        `   Delete manually: https://vercel.com/dashboard → Project → Domains`,
      );
    }

    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function testGetDomainConfig() {
  console.log("\n🔍 Test 4: Get Domain Config (for verification)");

  // Get first existing domain from project
  try {
    const listRes = await fetch(
      `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains${teamParam}`,
      { headers: getHeaders() }
    );

    if (!listRes.ok) {
      console.error("❌ Cannot list domains to test config endpoint");
      return false;
    }

    const listData = await listRes.json();
    if (listData.domains.length === 0) {
      console.log("⚠️ No domains found to test — skipping config test");
      return true; // Not a failure, just nothing to test
    }

    const testDomain = listData.domains[0].name;
    console.log(`   Testing with existing domain: ${testDomain}`);

    const configRes = await fetch(
      `${VERCEL_API}/v6/domains/${testDomain}/config${teamParam}`,
      { headers: getHeaders() }
    );

    if (!configRes.ok) {
      console.error(`❌ Failed: ${configRes.status} ${configRes.statusText}`);
      return false;
    }

    const configData = await configRes.json();
    console.log(`✅ Success: Retrieved config for ${testDomain}`);
    console.log(`   Misconfigured: ${configData.misconfigured}`);
    if (configData.misconfigured) {
      console.log(`   (Domain needs DNS setup)`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Vercel Token Verification");
  console.log("=====================================");
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Team ID: ${TEAM_ID || "(none - personal account)"}`);
  console.log(`Token: ${TOKEN.slice(0, 10)}...${TOKEN.slice(-4)}`);

  const results = {
    userInfo: await testUserInfo(),
    listDomains: await testListDomains(),
    addDomain: await testAddDomain(),
    getDomainConfig: await testGetDomainConfig(),
  };

  console.log("\n=====================================");
  console.log("📊 Results Summary");
  console.log("=====================================");
  console.log(`User Info:         ${results.userInfo ? "✅" : "❌"}`);
  console.log(`List Domains:      ${results.listDomains ? "✅" : "❌"}`);
  console.log(`Add Domain:        ${results.addDomain ? "✅" : "❌"}`);
  console.log(`Get Domain Config: ${results.getDomainConfig ? "✅" : "❌"}`);

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    console.log("\n✅ All tests passed! Token has correct scopes.");
    console.log("   Custom domains will work correctly in production.");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed. See errors above.");
    console.log("\n🔧 Troubleshooting:");

    if (!results.userInfo) {
      console.log("   - Token is invalid or expired");
      console.log("   - Generate a new token at https://vercel.com/account/tokens");
    }

    if (!results.listDomains) {
      console.log("   - Token lacks domains:read scope");
      console.log("   - Verify VERCEL_PROJECT_ID is correct");
      console.log("   - Verify VERCEL_TEAM_ID matches the project owner");
    }

    if (!results.addDomain) {
      console.log("   - ⚠️ CRITICAL: Token lacks domains:write scope");
      console.log("   - Custom domains WILL NOT WORK in production");
      console.log("   - Generate a new token with full permissions");
    }

    console.log("\n💡 To fix:");
    console.log("   1. Go to https://vercel.com/account/tokens");
    console.log("   2. Delete the old token");
    console.log("   3. Create a new token (it will automatically have all scopes)");
    console.log("   4. Update AUTH_BEARER_TOKEN in .env.local or Vercel dashboard");
    console.log("   5. If updated in Vercel, re-deploy the project");
    console.log("   6. Run this script again: npm run verify:vercel");

    process.exit(1);
  }
}

main();
