# ==============================
# AI Application Compiler Platform
# Robust Startup Script (v2.0)
# ==============================
# This script now:
#   • Detects the project root automatically.
#   • Verifies required files/folders.
#   • Installs missing npm / pip packages.
#   • Starts backend (FastAPI) and frontend (Vite) in separate windows.
#   • Fixes Vite proxy config if needed.
#   • Prints a diagnostic report.

# --------------------------------------------------------------------
# Helper: Write colored messages
function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Warn($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-ErrorMsg($msg) { Write-Host $msg -ForegroundColor Red }

# --------------------------------------------------------------------
# 1️⃣ Determine the project root (folder where this script resides)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectRoot
Write-Info "`n[1/5] Project root resolved:"
Write-Info "    $ProjectRoot`n"

# --------------------------------------------------------------------
# 2️⃣ Verify expected structure
$FrontendPath   = Join-Path $ProjectRoot 'frontend'
$BackendPath    = Join-Path $ProjectRoot 'backend'
$ViteConfigPath = Join-Path $FrontendPath 'vite.config.js'
$PackageJson    = Join-Path $FrontendPath 'package.json'
$Requirements   = Join-Path $BackendPath 'requirements.txt'
$BackendEntry   = Get-ChildItem $BackendPath -Filter '*.py' |
                  Where-Object { $_.Name -match '^(main|app)\.py$' } |
                  Select-Object -First 1

$Missing = @()
if (-not (Test-Path $FrontendPath))               { $Missing += "frontend folder" }
if (-not (Test-Path $BackendPath))                { $Missing += "backend folder" }
if (-not (Test-Path $PackageJson))                { $Missing += "frontend/package.json" }
if (-not (Test-Path $ViteConfigPath))            { $Missing += "frontend/vite.config.js" }
if (-not (Test-Path $Requirements))               { $Missing += "backend/requirements.txt" }
if (-not $BackendEntry)                           { $Missing += "backend/main.py or app.py" }

if ($Missing.Count -gt 0) {
    Write-ErrorMsg "❌ Missing required files/folders:"
    $Missing | ForEach-Object { Write-ErrorMsg "   • $_" }
    Write-ErrorMsg "`nPlease create the missing items and re‑run the script."
    exit 1
}
Write-Success "✅ All required files/folders are present.`n"

# --------------------------------------------------------------------
# 3️⃣ Frontend recovery
Write-Info "[2/5] Setting up frontend..."
Set-Location $FrontendPath

# Ensure node_modules exists; if not, run npm install
if (-not (Test-Path (Join-Path $FrontendPath 'node_modules'))) {
    Write-Warn "   node_modules not found – installing npm packages..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "npm install failed. Abort."
        exit 1
    }
    Write-Success "   npm packages installed."
} else {
    Write-Info "   node_modules already present – skipping npm install."
}

# Ensure Vite proxy points to the backend
$ProxySnippet = @"
server: {
    proxy: {
        "/api": {
            target: "http://localhost:8000",
            changeOrigin: true
        }
    }
}
"@

if (Test-Path $ViteConfigPath) {
    $ViteContent = Get-Content $ViteConfigPath -Raw
    if ($ViteContent -notmatch '/"api"\s*:\s*{[^}]*target:\s*"http://localhost:8000"') {
        Write-Warn "   Vite proxy not configured – updating vite.config.js"
        $Updated = $ViteContent -replace '(export\s+default\s+{)', "`$1`n$ProxySnippet"
        Set-Content -Path $ViteConfigPath -Value $Updated -Encoding UTF8
        Write-Success "   Proxy configuration added."
    } else {
        Write-Info "   Vite proxy already correctly configured."
    }
}

# Start frontend dev server in a new window (non‑blocking)
Write-Info "   Launching Vite dev server..."
Start-Process "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList '-NoExit', '-Command', 'npm run dev' -WorkingDirectory $FrontendPath -WindowStyle Normal

# --------------------------------------------------------------------
# 4️⃣ Backend recovery
Write-Info "`n[3/5] Setting up backend..."
Set-Location $BackendPath

# Install Python dependencies if needed
if (-not (Test-Path (Join-Path $BackendPath 'venv'))) {
    Write-Warn "   Virtual environment not found – creating & installing deps..."
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r $Requirements
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "pip install failed. Abort."
        exit 1
    }
    Write-Success "   Backend dependencies installed."
} else {
    Write-Info "   Activating existing virtual environment."
    .\venv\Scripts\Activate.ps1
}

# Determine the entry script (main.py or app.py)
$BackendScript = $BackendEntry.FullName
Write-Info "   Backend entry point: $BackendScript"

# Start FastAPI server in a new window
Write-Info "   Launching FastAPI (uvicorn)..."
Start-Process "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList '-NoExit', '-Command', "uvicorn backend.main:app --reload --port 8000" -WorkingDirectory $BackendPath -WindowStyle Normal

# --------------------------------------------------------------------
# 5️⃣ Diagnostic Report
Write-Info "`n===== Diagnostic Report ====="
Write-Info "Project root   : $ProjectRoot"
Write-Info "Frontend path  : $FrontendPath"
Write-Info "Backend path   : $BackendPath"
Write-Info "Backend entry  : $BackendScript"

Write-Info "`nPorts expected:"
Write-Info "   • Frontend → http://localhost:5173"
Write-Info "   • Backend  → http://localhost:8000"

Write-Info "`nCheck the two newly‑opened PowerShell windows for any runtime errors."
Write-Info "   • Backend logs will show when the server is listening."
Write-Info "   • Frontend logs will show Vite's dev server status."
Write-Info "`nIf any of the above checks fail, please copy the error output and let me know."
Write-Info "==============================`n"

# End of script
