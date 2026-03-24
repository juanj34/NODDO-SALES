"""QA Reconnaissance: Login page + public pages screenshots"""
from playwright.sync_api import sync_playwright
import os

SCREENSHOTS = "c:/Users/Juan/Documents/ANTIGRAVITY/NODDO/qa-screenshots"
os.makedirs(SCREENSHOTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Capture console errors
    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # 1. Login page
    print("=== LOGIN PAGE ===")
    page.goto("http://localhost:3000/login", wait_until="networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{SCREENSHOTS}/01-login.png", full_page=True)
    print(f"  URL: {page.url}")

    # Check what form elements exist
    inputs = page.locator("input").all()
    print(f"  Inputs found: {len(inputs)}")
    for inp in inputs:
        input_type = inp.get_attribute("type") or "text"
        placeholder = inp.get_attribute("placeholder") or ""
        name = inp.get_attribute("name") or ""
        print(f"    - type={input_type} name={name} placeholder={placeholder}")

    buttons = page.locator("button").all()
    print(f"  Buttons found: {len(buttons)}")
    for btn in buttons:
        text = btn.text_content().strip()
        if text:
            print(f"    - {text}")

    # 2. Marketing/public pages
    public_pages = [
        ("http://localhost:3000/", "02-homepage"),
        ("http://localhost:3000/pricing", "03-pricing"),
        ("http://localhost:3000/nosotros", "04-nosotros"),
    ]

    for url, name in public_pages:
        print(f"\n=== {name.upper()} ===")
        page.goto(url, wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{SCREENSHOTS}/{name}.png", full_page=True)
        print(f"  URL: {page.url}")

    # 3. Try to access dashboard (should redirect to login)
    print("\n=== DASHBOARD (unauthenticated) ===")
    page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
    page.wait_for_timeout(1500)
    print(f"  Redirected to: {page.url}")
    page.screenshot(path=f"{SCREENSHOTS}/05-dashboard-unauth.png", full_page=True)

    # 4. Check if there's a public microsite
    print("\n=== MICROSITIO (check if any exists) ===")
    page.goto("http://localhost:3000/sites/demo", wait_until="networkidle")
    page.wait_for_timeout(2000)
    print(f"  URL: {page.url}")
    page.screenshot(path=f"{SCREENSHOTS}/06-microsite-demo.png", full_page=True)

    # Print console errors
    if errors:
        print(f"\n=== CONSOLE ERRORS ({len(errors)}) ===")
        for e in errors[:20]:
            print(f"  {e}")
    else:
        print("\n=== NO CONSOLE ERRORS ===")

    browser.close()
    print("\nDone! Screenshots saved to qa-screenshots/")
