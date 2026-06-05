$ErrorActionPreference = 'Stop'

function Write-Info($message) { Write-Host $message -ForegroundColor Cyan }
function Write-Ok($message) { Write-Host $message -ForegroundColor Green }
function Write-Warn($message) { Write-Host $message -ForegroundColor Yellow }
function Write-Fail($message) { Write-Host $message -ForegroundColor Red }

function Get-ListeningProcess($port) {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conn) { return $null }
    return Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
}

function Get-StatusCode($url, $expectHtml = $false) {
    try {
        if ($expectHtml) {
            $response = Invoke-WebRequest -Uri $url -Headers @{ Accept = 'text/html' } -UseBasicParsing -SkipHttpErrorCheck -TimeoutSec 5
        } else {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -SkipHttpErrorCheck -TimeoutSec 5
        }
        return $response.StatusCode
    } catch {
        return $null
    }
}

function Wait-ForStatus($url, $expectedStatus = 200, $attempts = 10, $delaySeconds = 1, $expectHtml = $false) {
    $lastStatus = $null
    for ($i = 0; $i -lt $attempts; $i++) {
        $lastStatus = Get-StatusCode $url $expectHtml
        if ($lastStatus -eq $expectedStatus) { return $lastStatus }
        Start-Sleep -Seconds $delaySeconds
    }
    return $lastStatus
}

$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$backendLog = Join-Path $backendDir 'backend.err.log'
$frontendLog = Join-Path $frontendDir 'frontend.log'
$frontendErr = Join-Path $frontendDir 'frontend.err.log'

Write-Info "Starting AI Application Compiler..."

if (-not (Test-Path $backendDir)) { throw "Missing folder: $backendDir" }
if (-not (Test-Path $frontendDir)) { throw "Missing folder: $frontendDir" }

$venvPython = Join-Path $backendDir 'venv\Scripts\python.exe'
if (Test-Path $venvPython) {
    $pythonExe = $venvPython
} else {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) { throw 'Python was not found. Install Python or create backend\venv first.' }
    $pythonExe = $pythonCmd.Source
}

$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) { throw 'npm.cmd was not found. Install Node.js/npm first.' }

$backendProcess = Get-ListeningProcess 8000
if ($backendProcess) {
    Write-Warn "Backend already listening on 8000 (PID $($backendProcess.Id), $($backendProcess.ProcessName))."
} else {
    if (Test-Path $backendLog) { Remove-Item $backendLog -Force }
    $backendStart = Start-Process -FilePath $pythonExe `
        -ArgumentList '-m','uvicorn','backend.main:app','--host','127.0.0.1','--port','8000','--reload' `
        -WorkingDirectory $projectRoot `
        -RedirectStandardError $backendLog `
        -PassThru
    Write-Info "Backend starting (PID $($backendStart.Id))..."
}

$frontendProcess = Get-ListeningProcess 5173
if ($frontendProcess) {
    Write-Warn "Frontend already listening on 5173 (PID $($frontendProcess.Id), $($frontendProcess.ProcessName))."
} else {
    if (Test-Path $frontendLog) { Remove-Item $frontendLog -Force }
    if (Test-Path $frontendErr) { Remove-Item $frontendErr -Force }
    $frontendStart = Start-Process -FilePath $npmCmd.Source `
        -ArgumentList 'run','dev','--','--host','127.0.0.1','--port','5173' `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput $frontendLog `
        -RedirectStandardError $frontendErr `
        -PassThru
    Write-Info "Frontend starting (PID $($frontendStart.Id))..."
}

Start-Sleep -Seconds 3

$backendStatus = Wait-ForStatus 'http://127.0.0.1:8000/'
$frontendStatus = Wait-ForStatus 'http://127.0.0.1:5173/' 200 10 1 $true

if ($backendStatus -eq 200) {
    Write-Ok "Backend is up: http://127.0.0.1:8000/ (docs: http://127.0.0.1:8000/docs)"
} else {
    Write-Fail "Backend check failed (status: $backendStatus). See $backendLog"
}

if ($frontendStatus -eq 200) {
    Write-Ok "Frontend is up: http://127.0.0.1:5173/"
} else {
    Write-Fail "Frontend check failed (status: $frontendStatus). See $frontendLog and $frontendErr"
}

Write-Info "Done."