# wait-for-backend.ps1

$root = Get-Location
$portFile = Join-Path $root ".backend_port"

Write-Host "⏳ Waiting for backend to select a port..."
while (-not (Test-Path $portFile)) {
    Start-Sleep -Seconds 1
}

$port = Get-Content $portFile -Raw
$port = $port.Trim()

Write-Host "✅ Backend selected port $port. Waiting for service to be ready..."
npx wait-on -t 30000 "http://localhost:$port"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend did not start in time on port $port"
    exit 1
}

Write-Host "🚀 Backend is ready on port $port. Starting frontend..."
cd frontend
npm run dev
