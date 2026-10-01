$BaseDir = Join-Path (Get-Location).Path "backend\app"

$DirsToCreate = @(
    "domain\entities",
    "domain\repositories",
    "domain\exceptions",
    "application\use_cases",
    "application\dtos",
    "infrastructure\database\models",
    "infrastructure\database\repositories",
    "infrastructure\web\api"
)

foreach ($dir in $DirsToCreate) {
    $path = Join-Path $BaseDir $dir
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
    }
}

# 1. Move schemas
$schemasDir = Join-Path $BaseDir "schemas"
$dtosDir = Join-Path $BaseDir "application\dtos"
if (Test-Path $schemasDir) {
    Get-ChildItem -Path $schemasDir | Move-Item -Destination $dtosDir -Force
    Remove-Item -Path $schemasDir -Force
}

# 2. Move models
$modelsDir = Join-Path $BaseDir "models"
$infraModelsDir = Join-Path $BaseDir "infrastructure\database\models"
if (Test-Path $modelsDir) {
    Get-ChildItem -Path $modelsDir | Move-Item -Destination $infraModelsDir -Force
    Remove-Item -Path $modelsDir -Force
}

# 3. Move api
$apiDir = Join-Path $BaseDir "api"
$infraApiDir = Join-Path $BaseDir "infrastructure\web\api"
if (Test-Path $apiDir) {
    Get-ChildItem -Path $apiDir | Move-Item -Destination $infraApiDir -Force
    Remove-Item -Path $apiDir -Force
}

# 4. Replace imports
$files = Get-ChildItem -Path $BaseDir -Recurse -Filter "*.py"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    $content = $content -replace 'app\.schemas\.', 'app.application.dtos.'
    $content = $content -replace 'app\.schemas ', 'app.application.dtos '
    
    $content = $content -replace 'app\.models\.', 'app.infrastructure.database.models.'
    $content = $content -replace 'app\.models ', 'app.infrastructure.database.models '
    
    $content = $content -replace 'app\.api\.', 'app.infrastructure.web.api.'
    $content = $content -replace 'app\.api ', 'app.infrastructure.web.api '
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
}

# Fix env.py
$envPy = Join-Path (Get-Location).Path "backend\migrations\env.py"
if (Test-Path $envPy) {
    $content = Get-Content $envPy -Raw
    $content = $content -replace 'app\.models\.', 'app.infrastructure.database.models.'
    $content = $content -replace 'app\.models ', 'app.infrastructure.database.models '
    Set-Content -Path $envPy -Value $content -Encoding UTF8
}

Write-Host "Refactor PowerShell script completed successfully."
