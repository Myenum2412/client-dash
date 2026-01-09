# Clear Next.js and Node caches
Write-Host "Stopping Node processes..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Clearing .next cache..."
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Clearing node_modules cache..."
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cache cleared! Now restart your dev server with: npm run dev"
