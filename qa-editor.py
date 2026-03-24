"""QA: Editor pages - full authenticated test"""
import json
import urllib.request
import os
import re

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

def safe_goto(page, url, timeout=60000):
    """Navigate with error handling"""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout)
        page.wait_for_timeout(3000)
        return True
    except Exception as e:
        print(f"  Navigation error: {str(e)[:100]}")
        try:
            page.wait_for_timeout(5000)
            page.screenshot(path=f"{SCREENSHOTS}/error-{url.split('/')[-1]}.png")
        except Exception:
            pass
        return False

from playwright.sync_api import sync_playwright

print("Getting auth session...")
session = get_auth_session()
print(f"Authenticated as: {session.get('user', {}).get('email', '?')}")

# Get projects via API
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
    for p in projects:
        print(f"  - {p.get('nombre','')} | slug={p.get('slug','')} | id={p.get('id','')[:12]}...")
except Exception as e:
    print(f"API error: {e}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # Auth
    page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)
    set_auth_cookies(page.context, session)

    # === DASHBOARD ===
    print("\n" + "="*60)
    print("DASHBOARD")
    print("="*60)
    safe_goto(page, "http://localhost:3000/dashboard")
    page.screenshot(path=f"{SCREENSHOTS}/11-dashboard.png", full_page=True)
    print(f"  URL: {page.url}")

    # If auth failed, re-auth
    if "/login" in page.url:
        print("  Re-authenticating...")
        session = get_auth_session()
        set_auth_cookies(page.context, session)
        safe_goto(page, "http://localhost:3000/dashboard")

    # === PROYECTOS ===
    print("\n" + "="*60)
    print("PROYECTOS")
    print("="*60)
    safe_goto(page, "http://localhost:3000/proyectos")
    page.screenshot(path=f"{SCREENSHOTS}/12-proyectos.png", full_page=True)
    print(f"  URL: {page.url}")

    # === EDITOR TABS ===
    pid = projects[0]["id"] if projects else None
    slug = projects[0].get("slug") if projects else None

    if pid:
        print(f"\nUsing project: {projects[0].get('nombre', '?')} ({pid[:12]}...)")

        editor_pages = [
            ("", "13-editor-general", "General"),
            ("tipologias", "14-editor-tipologias", "Tipologias"),
            ("galeria", "15-editor-galeria", "Galeria"),
            ("videos", "15b-editor-videos", "Videos"),
            ("inventario", "16-editor-inventario", "Inventario"),
            ("disponibilidad", "17-editor-disponibilidad", "Disponibilidad"),
            ("fachada", "17b-editor-fachada", "Fachada"),
            ("configuracion", "18-editor-config", "Configuracion"),
        ]

        for tab, name, label in editor_pages:
            url = f"http://localhost:3000/editor/{pid}" + (f"/{tab}" if tab else "")
            print(f"\n{'='*60}")
            print(f"EDITOR: {label}")
            print(f"{'='*60}")

            # Re-auth if needed
            if "/login" in page.url:
                session = get_auth_session()
                set_auth_cookies(page.context, session)

            ok = safe_goto(page, url, timeout=60000)
            if ok:
                page.screenshot(path=f"{SCREENSHOTS}/{name}.png", full_page=True)
                print(f"  URL: {page.url}")

                # Extra analysis for specific tabs
                if tab == "disponibilidad":
                    # Count interactive elements
                    unit_rows = page.locator("[class*='hover:bg']").all()
                    print(f"  Unit rows: {len(unit_rows)}")

                    # Check for new sort buttons
                    header_buttons = page.locator("button:has-text('Unidad'), button:has-text('Area'), button:has-text('Precio'), button:has-text('Estado')").all()
                    print(f"  Sort header buttons: {len(header_buttons)}")

                    # Check estado filter pills
                    disp_btns = page.locator("button:has-text('Disp.'), button:has-text('Sep.'), button:has-text('Vend.'), button:has-text('Res.')").all()
                    print(f"  Estado filter buttons: {len(disp_btns)}")

                    # Try sorting by clicking "Unidad" header
                    unidad_sort = page.locator("button:has-text('Unidad')").first
                    if unidad_sort:
                        try:
                            unidad_sort.click()
                            page.wait_for_timeout(500)
                            page.screenshot(path=f"{SCREENSHOTS}/17a-disp-sorted-asc.png", full_page=True)
                            print("  Sorted ASC screenshot taken")

                            unidad_sort.click()
                            page.wait_for_timeout(500)
                            page.screenshot(path=f"{SCREENSHOTS}/17b-disp-sorted-desc.png", full_page=True)
                            print("  Sorted DESC screenshot taken")
                        except Exception as e:
                            print(f"  Sort test error: {e}")

                    # Try filtering by estado
                    vend_btn = page.locator("button:has-text('Vend.')").first
                    if vend_btn:
                        try:
                            vend_btn.click()
                            page.wait_for_timeout(500)
                            page.screenshot(path=f"{SCREENSHOTS}/17c-disp-filtered-vendida.png", full_page=True)
                            print("  Filtered 'Vendida' screenshot taken")
                            # Click again to clear filter
                            vend_btn.click()
                            page.wait_for_timeout(300)
                        except Exception as e:
                            print(f"  Filter test error: {e}")

                if tab == "inventario":
                    # Scroll to see table
                    page.evaluate("window.scrollTo(0, 300)")
                    page.wait_for_timeout(500)
                    page.screenshot(path=f"{SCREENSHOTS}/16a-inventario-table.png", full_page=True)

            else:
                print(f"  FAILED to load {label}")

    # === PUBLIC MICROSITIO ===
    if slug:
        print(f"\n\n{'='*60}")
        print(f"MICROSITIO: /sites/{slug}")
        print(f"{'='*60}")

        micro_pages = [
            ("", "20-micro-landing"),
            ("tipologias", "21-micro-tipologias"),
            ("galeria", "22-micro-galeria"),
            ("inventario", "23-micro-inventario"),
            ("ubicacion", "24-micro-ubicacion"),
            ("contacto", "25-micro-contacto"),
        ]
        for mp, mn in micro_pages:
            url = f"http://localhost:3000/sites/{slug}" + (f"/{mp}" if mp else "")
            print(f"\n  --- {mn} ---")
            ok = safe_goto(page, url, timeout=45000)
            if ok:
                page.screenshot(path=f"{SCREENSHOTS}/{mn}.png", full_page=True)
                print(f"  URL: {page.url}")
            else:
                print(f"  FAILED to load {mn}")

    # === CONSOLE ERRORS ===
    unique_errors = set()
    for e in errors:
        if "facebook" in e or "fbevents" in e or "esm.sh" in e:
            continue
        unique_errors.add(e[:200])

    print(f"\n\n{'='*60}")
    print(f"CONSOLE ERRORS ({len(unique_errors)} unique, excluding CSP/Facebook)")
    print(f"{'='*60}")
    for e in sorted(unique_errors):
        print(f"  {e}")

    if not unique_errors:
        print("  None!")

    browser.close()
    print(f"\n\nQA Complete! {len(os.listdir(SCREENSHOTS))} screenshots in qa-screenshots/")
