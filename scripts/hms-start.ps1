# Start Django API (:8001) and Vite UI (:5173) on Windows.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Root "backend\.venv\Scripts\python.exe"
$Npm = "npm"

if (-not (Test-Path $Python)) {
    Write-Error "Python venv not found at $Python. Create it with: py -3.13 -m venv backend\.venv"
}

$env:Path = "C:\Program Files\nodejs;" + $env:Path

Start-Process -WorkingDirectory (Join-Path $Root "backend") -FilePath $Python -ArgumentList @("manage.py", "runserver", "8001")
Start-Process -WorkingDirectory (Join-Path $Root "frontend") -FilePath "cmd.exe" -ArgumentList @("/c", "npm run dev")

Write-Host "Started API http://localhost:8001 and UI http://localhost:5173"
Write-Host "Demo login: admin / adminpass123"
