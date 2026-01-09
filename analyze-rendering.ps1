# ============================================================================
# RENDERING ANALYSIS SCRIPT
# ============================================================================
# This script analyzes the frequent re-rendering issue in your PWA application
# Run this to get a detailed report of the issues found
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RENDERING ANALYSIS REPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Issue 1: Dashboard Re-rendering
Write-Host "[ISSUE 1] Dashboard Page Constantly Re-rendering" -ForegroundColor Red
Write-Host "Location: /dashboard route" -ForegroundColor Yellow
Write-Host "Evidence from terminal logs:" -ForegroundColor Gray
Write-Host "  - GET /dashboard 200 in ~250-400ms (repeating every few seconds)" -ForegroundColor Gray
Write-Host "  - Cache skipped reason: (auto no cache)" -ForegroundColor Gray
Write-Host "  - Supabase auth check on EVERY render" -ForegroundColor Gray
Write-Host ""
Write-Host "Root Causes:" -ForegroundColor Yellow
Write-Host "  1. refetchOnWindowFocus: true (global setting)" -ForegroundColor White
Write-Host "  2. refetchInterval: 30_000 (30 seconds auto-refresh)" -ForegroundColor White
Write-Host "  3. Multiple components polling simultaneously" -ForegroundColor White
Write-Host "  4. No request deduplication for auth checks" -ForegroundColor White
Write-Host ""

# Issue 2: Multiple Polling Intervals
Write-Host "[ISSUE 2] Multiple Components with Aggressive Polling" -ForegroundColor Red
Write-Host "Found components with refetchInterval:" -ForegroundColor Yellow
Write-Host "  - app-sidebar-client.tsx: 30s interval" -ForegroundColor Gray
Write-Host "  - sidebar-files-items.tsx: 30s interval" -ForegroundColor Gray
Write-Host "  - use-files.ts hooks: 30s interval" -ForegroundColor Gray
Write-Host "  - file-management-client.tsx: 30s interval" -ForegroundColor Gray
Write-Host "  - project-details: 60s interval" -ForegroundColor Gray
Write-Host "  - chat messages: 10s interval (!)" -ForegroundColor Gray
Write-Host ""
Write-Host "Impact:" -ForegroundColor Yellow
Write-Host "  - Multiple timers running simultaneously" -ForegroundColor White
Write-Host "  - Cascading re-renders across component tree" -ForegroundColor White
Write-Host "  - Excessive network requests" -ForegroundColor White
Write-Host "  - Battery drain on mobile devices" -ForegroundColor White
Write-Host ""

# Issue 3: Window Focus Refetching
Write-Host "[ISSUE 3] Aggressive Window Focus Refetching" -ForegroundColor Red
Write-Host "Global setting: refetchOnWindowFocus: true" -ForegroundColor Yellow
Write-Host ""
Write-Host "Problem:" -ForegroundColor Yellow
Write-Host "  - Every time you click on the browser window" -ForegroundColor White
Write-Host "  - Every time you switch tabs and come back" -ForegroundColor White
Write-Host "  - All queries refetch simultaneously" -ForegroundColor White
Write-Host "  - Causes visible UI flashing and loading states" -ForegroundColor White
Write-Host ""

# Issue 4: Cache Configuration
Write-Host "[ISSUE 4] Cache Not Being Utilized Effectively" -ForegroundColor Red
Write-Host "Evidence: 'Cache skipped reason: (auto no cache)'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Issues:" -ForegroundColor Yellow
Write-Host "  - Server-side auth checks bypass cache" -ForegroundColor White
Write-Host "  - staleTime too low (30s) for relatively static data" -ForegroundColor White
Write-Host "  - No conditional requests (ETag/If-Modified-Since)" -ForegroundColor White
Write-Host ""

# Issue 5: PWA-Specific Issues
Write-Host "[ISSUE 5] PWA Realtime Features Causing Loops" -ForegroundColor Red
Write-Host "Components:" -ForegroundColor Yellow
Write-Host "  - ServiceWorkerRegister (checking for updates)" -ForegroundColor Gray
Write-Host "  - PWAInstallPrompt (event listeners)" -ForegroundColor Gray
Write-Host "  - Multiple realtime hooks running" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] Disable Aggressive Polling" -ForegroundColor Green
Write-Host "    - Remove refetchInterval for most components" -ForegroundColor White
Write-Host "    - Use manual refetch or websockets for realtime data" -ForegroundColor White
Write-Host "    - Keep polling only for critical realtime features" -ForegroundColor White
Write-Host ""

Write-Host "[2] Optimize Window Focus Behavior" -ForegroundColor Green
Write-Host "    - Set refetchOnWindowFocus: false globally" -ForegroundColor White
Write-Host "    - Enable selectively for critical data only" -ForegroundColor White
Write-Host "    - Use longer staleTime (5-15 minutes)" -ForegroundColor White
Write-Host ""

Write-Host "[3] Implement Request Deduplication" -ForegroundColor Green
Write-Host "    - TanStack Query already does this, but ensure proper queryKeys" -ForegroundColor White
Write-Host "    - Consolidate multiple hooks fetching same data" -ForegroundColor White
Write-Host ""

Write-Host "[4] Use Websockets for Realtime" -ForegroundColor Green
Write-Host "    - Replace polling with Supabase Realtime subscriptions" -ForegroundColor White
Write-Host "    - Only for data that truly needs realtime updates" -ForegroundColor White
Write-Host ""

Write-Host "[5] Optimize Auth Checks" -ForegroundColor Green
Write-Host "    - Cache auth state in memory" -ForegroundColor White
Write-Host "    - Reduce server-side auth checks" -ForegroundColor White
Write-Host "    - Use middleware for auth instead of per-page checks" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run the following command to apply fixes:" -ForegroundColor Yellow
Write-Host "  .\fix-rendering.ps1" -ForegroundColor White
Write-Host ""
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  1. Update query-client.ts with optimized defaults" -ForegroundColor Gray
Write-Host "  2. Remove aggressive refetchInterval settings" -ForegroundColor Gray
Write-Host "  3. Optimize component-level query options" -ForegroundColor Gray
Write-Host "  4. Add performance monitoring utilities" -ForegroundColor Gray
Write-Host ""
