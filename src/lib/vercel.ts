const VERCEL_API = "https://api.vercel.com";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.AUTH_BEARER_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function teamParam() {
  return process.env.VERCEL_TEAM_ID
    ? `?teamId=${process.env.VERCEL_TEAM_ID}`
    : "";
}

export async function addDomainToVercel(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains${teamParam()}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  );
  return res.json();
}

export async function removeDomainFromVercel(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}${teamParam()}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );
  return res.ok;
}

export async function getDomainConfig(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v6/domains/${domain}/config${teamParam()}`,
    {
      headers: getHeaders(),
    }
  );
  return res.json();
}

export async function verifyDomain(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}/verify${teamParam()}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  return res.json();
}
