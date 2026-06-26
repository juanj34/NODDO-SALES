# NODDO render worker -- Railway go-live.
# Run this yourself: the agent's safe-mode classifier blocks live infra deploys,
# so the agent built + verified the worker and left this one-command deploy for you.
#
# Usage (from the render-worker folder):
#   powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#
# It: sets RENDER_SHARED_SECRET on the Railway service, deploys the worker via
# `railway up` (builds the Dockerfile = chromium image, ~3-5 min), ensures a public
# domain, and prints the URL you give back to the agent (= COTIZADOR_RENDER_URL).

$ErrorActionPreference = "Stop"

$secretsDir = Join-Path $HOME ".claude\secrets"
$tk     = (Get-Content (Join-Path $secretsDir "noddo-railway-token.token") -Raw).Trim()
$secret = (Get-Content (Join-Path $secretsDir "noddo-render-shared-secret.token") -Raw).Trim()

Remove-Item Env:\RAILWAY_API_TOKEN -ErrorAction SilentlyContinue
$env:RAILWAY_TOKEN = $tk
Set-Location $PSScriptRoot

Write-Host "==> Setting RENDER_SHARED_SECRET on service NODDO-SALES" -ForegroundColor Cyan
railway variables --set "RENDER_SHARED_SECRET=$secret" --service NODDO-SALES

Write-Host "==> Deploying the worker (railway up -- builds chromium image, be patient)" -ForegroundColor Cyan
railway up --service NODDO-SALES

Write-Host "==> Ensuring a public domain" -ForegroundColor Cyan
railway domain --service NODDO-SALES

Write-Host "==> Status" -ForegroundColor Cyan
railway status

Write-Host ""
Write-Host "DONE. Copy the https://<something>.up.railway.app URL printed above --" -ForegroundColor Green
Write-Host "that is COTIZADOR_RENDER_URL. Paste it back to the agent." -ForegroundColor Green
