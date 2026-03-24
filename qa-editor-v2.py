"""QA: Editor pages - longer waits + diagnostics"""
import json
import urllib.request
import os

env = {}
with open(".env.local") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            key, val = line.split("=", 1)
            env[key] = val

SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
ANON_KEY = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
SCREENSHOTS = "c:/Users/Juan/Documents/ANTIGRAVITY/NODDO/qa-screenshots"
os.makedirs(SCREENSHOTS, exist_ok=True)

def get_auth_session():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/admin/generate_link",
        data=json.dumps({"email": "juanjaramillo34@gmail.com", "type": "magiclink", "data": {}}).encode(),
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}", "Content-Type": "application/json"}
    )
    data = json.loads(urllib.request.urlopen(req).read())
    verify_req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/verify",
        data=json.dumps({"email": "juanjaramillo34@gmail.com", "token": data["email_otp"], "type": "magiclink"}).encode(),
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"}
    )
    return json.loads(urllib.request.urlopen(verify_req).read())

def set_auth_cookies(ctx, session):
    ref = "enmtlrrfvwuzxfqjnton"
    sj = json.dumps({"access_token": session["access_token"], "refresh_token": session["refresh_token"], "token_type": "bearer", "expires_in": 3600, "expires_at": 9999999999})
    chunks = [sj[i:i+3500] for i in range(0, len(sj), 3500)]
    for i, chunk in enumerate(chunks):
        ctx.add_cookies([{"name": f"sb-{ref}-auth-token.{i}", "value": chunk, "domain": "localhost", "path": "/", "httpOnly": False, "secure": False, "sameSite": "Lax"}])

from playwright.sync_api import sync_playwright

print("Getting auth session...")
session = get_auth_session()
print(f"Authenticated as: {session.get('user', {}).get('email', '?')}")

# Get first project ID
projects = []
try:
    cookies_header = "; ".join([
        f"sb-enmtlrrfvwuzxfqjnton-auth-token.0=" + json.dumps({
            "access_token": session["access_token"],
            "refresh_token": session["refresh_token"],
            "token_type": "bearer", "expires_in": 3600, "expires_at": 9999999999
        })
    ])
    api_req = urllib.request.Request("http://localhost:3000/api/proyectos", headers={
        "Cookie": cookies_header, "Content-Type": "application/json"
    })
    projects = json.loads(urllib.request.urlopen(api_req).read())
    if isinstance(projects, dict):
        projects = projects.get("data", [])
    print(f"Found {len(projects)} projects")
except Exception as e:
    print(f"API error: {e}")

pid = projects[0]["id"] if projects else None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # Auth
    page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    set_auth_cookies(page.context, session)

    # === Test 1: Dashboard with LONG wait ===
    print("\n=== DASHBOARD (10s wait) ===")
    page.goto("http://localhost:3000/dashboard", wait_until="domcontentloaded")
    page.wait_for_timeout(10000)
    page.screenshot(path=f"{SCREENSHOTS}/v2-dashboard-10s.png", full_page=True)
    print(f"  URL: {page.url}")

    # Check what's on the page
    body_text = page.locator("body").inner_text()
    print(f"  Body text length: {len(body_text)}")
    print(f"  Body text preview: {body_text[:300]}")

    # Check for loading indicators
    spinners = page.locator("[class*='animate-spin']").all()
    print(f"  Spinners still visible: {len(spinners)}")

    # === Test 2: Editor General with LONG wait ===
    if pid:
        print(f"\n=== EDITOR GENERAL (15s wait) ===")

        # Re-auth before editor
        session = get_auth_session()
        set_auth_cookies(page.context, session)

        page.goto(f"http://localhost:3000/editor/{pid}", wait_until="domcontentloaded")
        page.wait_for_timeout(15000)
        page.screenshot(path=f"{SCREENSHOTS}/v2-editor-general-15s.png", full_page=True)
        print(f"  URL: {page.url}")

        body_text = page.locator("body").inner_text()
        print(f"  Body text length: {len(body_text)}")
        print(f"  Body text preview: {body_text[:500]}")

        spinners = page.locator("[class*='animate-spin']").all()
        print(f"  Spinners still visible: {len(spinners)}")

        # Check console errors specific to this page
        editor_errors = [e for e in errors if "error" in e.lower() or "fail" in e.lower()]
        print(f"  Relevant errors: {len(editor_errors)}")
        for e in editor_errors[:5]:
            print(f"    {e[:200]}")

        # === Test 3: Disponibilidad with LONG wait ===
        print(f"\n=== DISPONIBILIDAD (15s wait) ===")
        session = get_auth_session()
        set_auth_cookies(page.context, session)

        page.goto(f"http://localhost:3000/editor/{pid}/disponibilidad", wait_until="domcontentloaded")
        page.wait_for_timeout(15000)
        page.screenshot(path=f"{SCREENSHOTS}/v2-disponibilidad-15s.png", full_page=True)
        print(f"  URL: {page.url}")

        body_text = page.locator("body").inner_text()
        print(f"  Body text length: {len(body_text)}")
        print(f"  Body text preview: {body_text[:500]}")

        # Check for unit rows, filters, etc
        spinners = page.locator("[class*='animate-spin']").all()
        print(f"  Spinners still visible: {len(spinners)}")

        # === Test 4: Inventario with LONG wait ===
        print(f"\n=== INVENTARIO (15s wait) ===")
        session = get_auth_session()
        set_auth_cookies(page.context, session)

        page.goto(f"http://localhost:3000/editor/{pid}/inventario", wait_until="domcontentloaded")
        page.wait_for_timeout(15000)
        page.screenshot(path=f"{SCREENSHOTS}/v2-inventario-15s.png", full_page=True)
        print(f"  URL: {page.url}")

        body_text = page.locator("body").inner_text()
        print(f"  Body text length: {len(body_text)}")
        print(f"  Body text preview: {body_text[:500]}")

        # Check for specific elements
        spinners = page.locator("[class*='animate-spin']").all()
        print(f"  Spinners still visible: {len(spinners)}")

        # Try checking cookies at this point
        cookies = page.context.cookies()
        auth_cookies = [c for c in cookies if "sb-" in c["name"]]
        print(f"\n  Auth cookies present: {len(auth_cookies)}")
        for c in auth_cookies:
            print(f"    {c['name']}: {c['value'][:40]}...")

    # Print unique console errors
    unique_errors = set()
    for e in errors:
        if "facebook" in e or "fbevents" in e or "mapbox" in e:
            continue
        unique_errors.add(e[:200])

    print(f"\n\n=== NON-MAPBOX CONSOLE ERRORS ({len(unique_errors)}) ===")
    for e in sorted(unique_errors):
        print(f"  {e}")

    browser.close()
    print("\nDone!")
