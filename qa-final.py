"""QA FINAL: Full test with proper re-auth per page + interactions"""
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

def auth_and_goto(page, url, label, wait=10000):
    """Re-authenticate and navigate to a page"""
    print(f"\n{'='*60}")
    print(f"{label}")
    print(f"{'='*60}")
    session = get_auth_session()
    set_auth_cookies(page.context, session)
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(wait)
        if "/login" in page.url:
            print(f"  REDIRECTED TO LOGIN - re-trying...")
            session = get_auth_session()
            set_auth_cookies(page.context, session)
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(wait)
        print(f"  URL: {page.url}")
        return "/login" not in page.url
    except Exception as e:
        print(f"  Navigation error: {str(e)[:100]}")
        return False

from playwright.sync_api import sync_playwright

# Get projects
print("Getting auth session...")
session = get_auth_session()
print(f"Authenticated as: {session.get('user', {}).get('email', '?')}")

projects = []
try:
    cookies_header = "sb-enmtlrrfvwuzxfqjnton-auth-token.0=" + json.dumps({
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
        "token_type": "bearer", "expires_in": 3600, "expires_at": 9999999999
    })
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
slug = projects[0].get("slug") if projects else None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # Initial page load for cookie domain
    page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
    page.wait_for_timeout(1000)

    results = {}

    # === DASHBOARD ===
    ok = auth_and_goto(page, "http://localhost:3000/dashboard", "DASHBOARD")
    page.screenshot(path=f"{SCREENSHOTS}/final-01-dashboard.png", full_page=True)
    results["dashboard"] = "OK" if ok else "FAIL"
    if ok:
        # Check KPI strip
        body = page.locator("body").inner_text()
        has_greeting = "Buenos" in body or "Buenas" in body
        has_projects = "Indigo" in body or "Garden" in body or "Meriva" in body
        print(f"  Greeting: {has_greeting} | Projects shown: {has_projects}")

    # === PROYECTOS ===
    ok = auth_and_goto(page, "http://localhost:3000/proyectos", "PROYECTOS")
    page.screenshot(path=f"{SCREENSHOTS}/final-02-proyectos.png", full_page=True)
    results["proyectos"] = "OK" if ok else "FAIL"
    if ok:
        rows = page.locator("tr, [class*='hover:bg']").all()
        print(f"  Table rows: {len(rows)}")

    if pid:
        # === EDITOR TABS ===
        editor_tabs = [
            ("", "EDITOR: General", "final-03-general"),
            ("etapas", "EDITOR: Etapas", "final-04-etapas"),
            ("tipologias", "EDITOR: Tipologias", "final-05-tipologias"),
            ("inventario", "EDITOR: Inventario", "final-06-inventario"),
            ("galeria", "EDITOR: Galeria", "final-07-galeria"),
            ("videos", "EDITOR: Videos", "final-08-videos"),
            ("disponibilidad", "EDITOR: Disponibilidad", "final-09-disponibilidad"),
            ("noddo-grid", "EDITOR: NODDO Grid", "final-10-noddo-grid"),
            ("implantaciones", "EDITOR: Implantaciones", "final-11-implantaciones"),
            ("configuracion", "EDITOR: Configuracion", "final-12-configuracion"),
            ("dominio", "EDITOR: Dominio", "final-13-dominio"),
            ("estadisticas", "EDITOR: Estadisticas", "final-14-estadisticas"),
        ]

        for tab, label, name in editor_tabs:
            url = f"http://localhost:3000/editor/{pid}" + (f"/{tab}" if tab else "")
            ok = auth_and_goto(page, url, label, wait=12000)
            page.screenshot(path=f"{SCREENSHOTS}/{name}.png", full_page=True)
            results[tab or "general"] = "OK" if ok else "FAIL"

            if ok:
                body = page.locator("body").inner_text()
                has_spinner = len(page.locator("[class*='animate-spin']").all()) > 0
                print(f"  Content loaded: {len(body) > 500} | Spinner: {has_spinner}")

        # === DISPONIBILIDAD DEEP TEST ===
        print(f"\n{'='*60}")
        print("DISPONIBILIDAD: Deep interaction test")
        print(f"{'='*60}")
        session = get_auth_session()
        set_auth_cookies(page.context, session)
        page.goto(f"http://localhost:3000/editor/{pid}/disponibilidad", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(12000)

        if "/login" not in page.url:
            # Count elements
            body = page.locator("body").inner_text()

            # Check for sortable headers
            sort_btns = page.locator("button:has-text('UNIDAD'), button:has-text('TIPO'), button:has-text('PRECIO'), button:has-text('ESTADO')").all()
            print(f"  Sortable headers: {len(sort_btns)}")

            # Check for estado filter pills
            estado_pills = page.locator("button:has-text('DISP.'), button:has-text('PROX.'), button:has-text('SEP.'), button:has-text('RES.'), button:has-text('VEND.')").all()
            print(f"  Estado filter pills: {len(estado_pills)}")

            # Check for tipo filter pills
            tipo_pills = page.locator("button:has-text('Tipo ')").all()
            print(f"  Tipo filter pills: {len(tipo_pills)}")

            # Try clicking "DISP." filter
            disp_pill = page.locator("button:has-text('DISP.')").first
            if disp_pill:
                try:
                    # Get the one in the filter bar (first occurrence, which is the filter)
                    disp_pill.click()
                    page.wait_for_timeout(1000)
                    page.screenshot(path=f"{SCREENSHOTS}/final-15-disp-filter-disponible.png", full_page=True)
                    print(f"  Filtered by DISP. - screenshot taken")
                    # Clear filter
                    disp_pill.click()
                    page.wait_for_timeout(500)
                except Exception as e:
                    print(f"  Filter click error: {e}")

            # Try sorting by UNIDAD
            unidad_btn = page.locator("button:has-text('UNIDAD')").first
            if unidad_btn:
                try:
                    unidad_btn.click()
                    page.wait_for_timeout(1000)
                    page.screenshot(path=f"{SCREENSHOTS}/final-16-disp-sorted.png", full_page=True)
                    print(f"  Sorted by UNIDAD - screenshot taken")
                except Exception as e:
                    print(f"  Sort click error: {e}")

            # Scroll down to see more units
            page.evaluate("window.scrollTo(0, 1000)")
            page.wait_for_timeout(500)
            page.screenshot(path=f"{SCREENSHOTS}/final-17-disp-scrolled.png", full_page=True)
            print(f"  Scrolled down - screenshot taken")

            # Try clicking a VEND. estado pill on a specific unit (should trigger confirm modal)
            # Find a unit that has DISP. active and try changing it
            disp_estado_btns = page.locator("button:has-text('PROX.')").all()
            if len(disp_estado_btns) > 5:
                try:
                    # Click a PROX. button in the rows (not the filter bar one)
                    disp_estado_btns[3].click()
                    page.wait_for_timeout(1000)
                    page.screenshot(path=f"{SCREENSHOTS}/final-18-disp-confirm-modal.png", full_page=True)
                    print(f"  Clicked estado change - modal screenshot taken")
                    # Close modal (press Escape)
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(500)
                except Exception as e:
                    print(f"  Estado change test error: {e}")

        # === INVENTARIO DEEP TEST ===
        print(f"\n{'='*60}")
        print("INVENTARIO: Deep test")
        print(f"{'='*60}")
        session = get_auth_session()
        set_auth_cookies(page.context, session)
        page.goto(f"http://localhost:3000/editor/{pid}/inventario", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(12000)

        if "/login" not in page.url:
            body = page.locator("body").inner_text()
            print(f"  Body text length: {len(body)}")
            print(f"  Preview: {body[:400]}")

            # Check for AI assistant button
            ai_btns = page.locator("button:has-text('Asistente'), button:has-text('AI'), button:has-text('asistente')").all()
            print(f"  AI assistant buttons: {len(ai_btns)}")

            # Check for table
            table_rows = page.locator("table tr, [role='row']").all()
            print(f"  Table rows: {len(table_rows)}")

            page.screenshot(path=f"{SCREENSHOTS}/final-19-inventario-loaded.png", full_page=True)

            # Scroll to see table content
            page.evaluate("window.scrollTo(0, 400)")
            page.wait_for_timeout(500)
            page.screenshot(path=f"{SCREENSHOTS}/final-20-inventario-scrolled.png", full_page=True)

    # === MICROSITIO (public, no auth needed) ===
    if slug:
        micro_pages = [
            ("", "MICRO: Landing", "final-21-micro-landing"),
            ("tipologias", "MICRO: Tipologias", "final-22-micro-tipologias"),
            ("galeria", "MICRO: Galeria", "final-23-micro-galeria"),
            ("inventario", "MICRO: Inventario", "final-24-micro-inventario"),
            ("ubicacion", "MICRO: Ubicacion", "final-25-micro-ubicacion"),
            ("contacto", "MICRO: Contacto", "final-26-micro-contacto"),
        ]
        for tab, label, name in micro_pages:
            url = f"http://localhost:3000/sites/{slug}" + (f"/{tab}" if tab else "")
            print(f"\n{'='*60}")
            print(label)
            print(f"{'='*60}")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(5000)
                page.screenshot(path=f"{SCREENSHOTS}/{name}.png", full_page=True)
                print(f"  URL: {page.url}")
                results[f"micro-{tab or 'landing'}"] = "OK"
            except Exception as e:
                print(f"  Error: {str(e)[:100]}")
                results[f"micro-{tab or 'landing'}"] = "FAIL"

    # === CONSOLE ERRORS ===
    unique_errors = set()
    for e in errors:
        if "facebook" in e or "fbevents" in e or "mapbox" in e or "esm.sh" in e:
            continue
        unique_errors.add(e[:200])

    print(f"\n\n{'='*60}")
    print(f"CONSOLE ERRORS ({len(unique_errors)} unique, excluding CSP/Facebook/Mapbox)")
    print(f"{'='*60}")
    for e in sorted(unique_errors):
        print(f"  {e}")
    if not unique_errors:
        print("  None!")

    # === SUMMARY ===
    print(f"\n\n{'='*60}")
    print("QA RESULTS SUMMARY")
    print(f"{'='*60}")
    for page_name, status in results.items():
        icon = "PASS" if status == "OK" else "FAIL"
        print(f"  [{icon}] {page_name}")

    browser.close()
    print(f"\n\nQA Complete! Screenshots in qa-screenshots/")
