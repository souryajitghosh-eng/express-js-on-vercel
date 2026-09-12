# ==============================================================================
# VoyaPulse - Quick GitHub Push Script
# ==============================================================================

$git = "C:\Users\Admin\.gemini\antigravity\scratch\mingit\cmd\git.exe"
$gh = "C:\Users\Admin\.gemini\antigravity\scratch\gh\bin\gh.exe"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   VoyaPulse GitHub Repository Deployment   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if authenticated with GitHub CLI
$authCheck = & $gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nYou need to log into your GitHub account first." -ForegroundColor Yellow
    Write-Host "Launching GitHub web login... (Press Enter to accept defaults)" -ForegroundColor Yellow
    & $gh auth login --web --git-protocol https
}

Write-Host "`nCreating repository and pushing code to GitHub..." -ForegroundColor Green
& $gh repo create voyapulse-tourism-platform --public --source=. --remote=origin --push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nRepository successfully created and pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "`nIf repository already exists, pushing directly to origin main..." -ForegroundColor Yellow
    & $git push -u origin main
}
