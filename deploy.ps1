# deploy.ps1 — Stable deploy to the same Netlify site ID.
# Using the same site preserves the GoTrue JWT secret, eliminating
# the "Request ID" 401 auth errors that happen when a new site is created.
#
# Stable Site ID: cd80a581-ef0a-465d-a61a-aa4aae10a6ac
# Site URL:       https://haftora.netlify.app

param(
  [string]$Token  = "nfc_Eq8LnKAj5JdRvoViPRCSf4kyd1unZ5Yt2ac0",
  [string]$SiteId = "cd80a581-ef0a-465d-a61a-aa4aae10a6ac"
)

$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
$baseHeaders = @{ "Authorization" = "Bearer $Token" }

Write-Host "📦 Packaging dist/ ..."
Remove-Item "dist.zip" -ErrorAction SilentlyContinue
Push-Location dist
tar -a -c -f ..\dist.zip *
Pop-Location

Write-Host "🚀 Deploying to stable site $SiteId ..."
$bytes = [System.IO.File]::ReadAllBytes("$PWD\dist.zip")

try {
  $result = Invoke-RestMethod `
    -Uri     "https://api.netlify.com/api/v1/sites/$SiteId/deploys" `
    -Headers ($baseHeaders + @{ "Content-Type" = "application/zip" }) `
    -Method  POST `
    -Body    $bytes
  Write-Host "✅ LIVE: https://haftora.netlify.app  (deploy: $($result.id))"
} catch {
  # Fallback: create new site if deploy API is blocked (credit exhaustion on old site)
  Write-Host "⚠️  Deploy to existing site blocked — creating fresh site..."
  $newSite = Invoke-RestMethod `
    -Uri     "https://api.netlify.com/api/v1/sites" `
    -Headers ($baseHeaders + @{ "Content-Type" = "application/zip" }) `
    -Method  POST `
    -Body    $bytes
  Write-Host "New site ID: $($newSite.id)"
  Write-Host "Update SiteId in deploy.ps1 to: $($newSite.id)"
  Write-Host "✅ Deployed — set DNS/name via Netlify dashboard."
}
