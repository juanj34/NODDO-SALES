"""Generate auth session via Supabase admin API and use it in Playwright"""
import json
import urllib.request
import os

# Read from .env.local
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

# Generate magic link
print("Generating magic link...")
req = urllib.request.Request(
    f"{SUPABASE_URL}/auth/v1/admin/generate_link",
    data=json.dumps({
        "email": "juanjaramillo34@gmail.com",
        "type": "magiclink",
        "data": {}
    }).encode(),
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
)

resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
action_link = data.get("action_link", "")
print(f"Action link: {action_link[:80]}...")

from playwright.sync_api import sync_playwright

SCREENSHOTS = "c:/Users/Juan/Documents/ANTIGRAVITY/NODDO/qa-screenshots"
os.makedirs(SCREENSHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # Step 1: Go to the app first so cookies are on localhost domain
    print("Loading app...")
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    page.wait_for_timeout(1000)

    # Step 2: Navigate to magic link — Supabase will redirect back with token
    print("Navigating to magic link...")
    page.goto(action_link, wait_until="networkidle")
    page.wait_for_timeout(5000)  # Wait for JS to process the hash fragment
    print(f"After magic link, URL: {page.url}")

    # Step 3: The Supabase client should have picked up the token.
    # If we're at / or /#access_token=..., the onAuthStateChange should fire.
    # Let's check if we have auth cookies now
    cookies = page.context.cookies()
    auth_cookies = [c for c in cookies if "supabase" in c["name"].lower() or "sb-" in c["name"].lower()]
    print(f"Auth cookies: {len(auth_cookies)}")
    for c in auth_cookies:
        print(f"  {c['name']}: {c['value'][:30]}...")

    # If no auth cookies, try navigating to /auth/callback with the token
    if not auth_cookies:
        print("\nNo auth cookies found. Trying to manually set session...")
        # Extract token from current URL hash
        current_url = page.url
        if "access_token=" in current_url:
            # Parse the hash params
            hash_part = current_url.split("#")[1] if "#" in current_url else ""
            params = dict(p.split("=", 1) for p in hash_part.split("&") if "=" in p)
            access_token = params.get("access_token", "")
            refresh_token = params.get("refresh_token", "")

            if access_token:
                print(f"  Found access_token: {access_token[:20]}...")
                print(f"  Found refresh_token: {refresh_token[:20]}...")

                # Use Supabase JS client to set the session
                result = page.evaluate(f"""
                    async () => {{
                        // The Supabase client should be available globally or we create one
                        try {{
                            const {{ createClient }} = await import('https://esm.sh/@supabase/supabase-js@2');
                            const supabase = createClient(
                                '{SUPABASE_URL}',
                                '{ANON_KEY}'
                            );
                            const {{ data, error }} = await supabase.auth.setSession({{
                                access_token: '{access_token}',
                                refresh_token: '{refresh_token}'
                            }});
                            return {{ success: !error, error: error?.message, user: data?.user?.email }};
                        }} catch(e) {{
                            return {{ success: false, error: e.message }};
                        }}
                    }}
                """)
                print(f"  setSession result: {result}")
                page.wait_for_timeout(2000)

    # Step 4: Navigate to dashboard
    print("\n=== DASHBOARD ===")
    page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
    page.wait_for_timeout(3000)
    final_url = page.url
    print(f"  URL: {final_url}")
    page.screenshot(path=f"{SCREENSHOTS}/11-dashboard.png", full_page=True)

    is_authenticated = "/login" not in final_url
    print(f"  Authenticated: {is_authenticated}")

    if not is_authenticated:
        print("\n*** AUTH FAILED - trying cookie injection approach ***")
        # Use the admin API to get a session token directly
        # We already have the access_token from the magic link, let's set it as a cookie
        current_url = page.url
        # Go back to root
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Try evaluating JS to set localStorage/cookies for Supabase SSR
        # The @supabase/ssr stores auth in cookies
        hash_part = ""
        for stored_url in [current_url, page.url]:
            if "access_token=" in stored_url:
                hash_part = stored_url.split("#")[1] if "#" in stored_url else ""
                break

        if hash_part:
            params = dict(p.split("=", 1) for p in hash_part.split("&") if "=" in p)
            access_token = params.get("access_token", "")
            refresh_token = params.get("refresh_token", "")
        else:
            # Re-generate a fresh token
            print("  Re-generating session...")
            req2 = urllib.request.Request(
                f"{SUPABASE_URL}/auth/v1/admin/generate_link",
                data=json.dumps({
                    "email": "juanjaramillo34@gmail.com",
                    "type": "magiclink",
                    "data": {}
                }).encode(),
                headers={
                    "apikey": SERVICE_KEY,
                    "Authorization": f"Bearer {SERVICE_KEY}",
                    "Content-Type": "application/json"
                }
            )
            resp2 = urllib.request.urlopen(req2)
            data2 = json.loads(resp2.read())
            # Get the OTP token
            email_otp = data2.get("email_otp", "")
            hashed_token = data2.get("hashed_token", "")
            print(f"  email_otp: {email_otp}")

            if email_otp:
                # Verify OTP to get access token
                verify_req = urllib.request.Request(
                    f"{SUPABASE_URL}/auth/v1/verify",
                    data=json.dumps({
                        "email": "juanjaramillo34@gmail.com",
                        "token": email_otp,
                        "type": "magiclink"
                    }).encode(),
                    headers={
                        "apikey": ANON_KEY,
                        "Content-Type": "application/json"
                    }
                )
                verify_resp = urllib.request.urlopen(verify_req)
                session_data = json.loads(verify_resp.read())
                access_token = session_data.get("access_token", "")
                refresh_token = session_data.get("refresh_token", "")
                print(f"  Got access_token: {access_token[:30]}...")
                print(f"  Got refresh_token: {refresh_token[:30]}...")

        if access_token and refresh_token:
            # Set the Supabase SSR cookies
            # @supabase/ssr uses chunked cookies: sb-{ref}-auth-token.0, sb-{ref}-auth-token.1, etc.
            ref = "enmtlrrfvwuzxfqjnton"
            session_json = json.dumps({
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": 3600,
                "expires_at": 9999999999
            })

            # Split into chunks of ~3500 chars for cookie limits
            chunk_size = 3500
            chunks = [session_json[i:i+chunk_size] for i in range(0, len(session_json), chunk_size)]

            for i, chunk in enumerate(chunks):
                page.context.add_cookies([{
                    "name": f"sb-{ref}-auth-token.{i}",
                    "value": chunk,
                    "domain": "localhost",
                    "path": "/",
                    "httpOnly": False,
                    "secure": False,
                    "sameSite": "Lax"
                }])

            print(f"  Set {len(chunks)} auth cookie chunks")
            page.wait_for_timeout(1000)

            # Try dashboard again
            page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
            page.wait_for_timeout(3000)
            print(f"  Dashboard URL: {page.url}")
            page.screenshot(path=f"{SCREENSHOTS}/11-dashboard.png", full_page=True)
            is_authenticated = "/login" not in page.url

    if is_authenticated:
        print("\n*** AUTHENTICATED SUCCESSFULLY ***")

        # PROYECTOS
        print("\n=== PROYECTOS ===")
        page.goto("http://localhost:3000/proyectos", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOTS}/12-proyectos.png", full_page=True)
        print(f"  URL: {page.url}")

        # Find project IDs from table rows
        import re
        content = page.content()
        project_ids = list(set(re.findall(r'/editor/([0-9a-f-]{36})', content)))
        print(f"  Project IDs: {len(project_ids)}")
        for pid in project_ids[:5]:
            print(f"    - {pid[:20]}...")

        if project_ids:
            pid = project_ids[0]

            # Editor tabs
            editor_pages = [
                ("", "13-editor-general"),
                ("tipologias", "14-editor-tipologias"),
                ("galeria", "15-editor-galeria"),
                ("inventario", "16-editor-inventario"),
                ("disponibilidad", "17-editor-disponibilidad"),
                ("configuracion", "18-editor-config"),
            ]

            for tab, name in editor_pages:
                url = f"http://localhost:3000/editor/{pid}" + (f"/{tab}" if tab else "")
                print(f"\n=== {name.upper().replace('-', ' ')} ===")
                page.goto(url, wait_until="networkidle")
                page.wait_for_timeout(2500)
                print(f"  URL: {page.url}")
                page.screenshot(path=f"{SCREENSHOTS}/{name}.png", full_page=True)

            # Find microsite slug
            page.goto(f"http://localhost:3000/editor/{pid}", wait_until="networkidle")
            page.wait_for_timeout(2000)
            slug_matches = re.findall(r'sites/([a-z0-9-]+)', page.content())
            if slug_matches:
                slug = slug_matches[0]
                print(f"\n=== MICROSITIO: /sites/{slug} ===")

                micro_pages = [
                    ("", "20-micro-landing"),
                    ("tipologias", "21-micro-tipologias"),
                    ("galeria", "22-micro-galeria"),
                    ("inventario", "23-micro-inventario"),
                ]
                for mp, mn in micro_pages:
                    url = f"http://localhost:3000/sites/{slug}" + (f"/{mp}" if mp else "")
                    print(f"\n  --- {mn} ---")
                    page.goto(url, wait_until="networkidle")
                    page.wait_for_timeout(2500)
                    print(f"  URL: {page.url}")
                    page.screenshot(path=f"{SCREENSHOTS}/{mn}.png", full_page=True)

    # Console errors
    if errors:
        print(f"\n=== CONSOLE ERRORS ({len(errors)}) ===")
        unique_errors = list(set(errors))
        for e in unique_errors[:20]:
            print(f"  {e[:200]}")
    else:
        print("\n=== NO CONSOLE ERRORS ===")

    browser.close()
    print("\nDone!")
