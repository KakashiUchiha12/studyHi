# PowerShell script to fix async params in Next.js 15 API routes
$rootPath = "d:\Study Planner app - no social media\study-planner\app\api"

# Pattern to match old-style params
$oldPattern1 = '\{ params \}: \{ params: \{ (.+): string \} \}'
$oldPattern2 = '\{ params \}: \{ params: Promise<\{ (.+): string \}> \}'

# Function to fix a single file
function Fix-RouteFile {
    param([string]$filePath)
    
    if (-not (Test-Path $filePath)) {
        return
    }
    
    $content = Get-Content $filePath -Raw
    
    # Skip if already fixed
    if ($content -match 'props: \{ params: Promise') {
        Write-Host "Already fixed: $filePath"
        return
    }
    
    # Fix pattern 1: { params }: { params: { id: string } }
    $content = $content -replace '\{ params \}: \{ params: \{ ([a-zA-Z]+): string \} \}', 'props: { params: Promise<{ $1: string }> }'
    
    # Add await after function signature
    $content = $content -replace '(\bprops: \{ params: Promise<\{ [a-zA-Z]+: string \}> \}\s*\)\s*\{)', "`$1`n  const params = await props.params;"
    
    # Fix await params.id pattern
    $content = $content -replace '\(await params\)\.([a-zA-Z]+)', 'params.$1'
    
    Set-Content -Path $filePath -Value $content
    Write-Host "Fixed: $filePath"
}

# Get all route files with dynamic segments
$routeFiles = Get-ChildItem -Path $rootPath -Recurse -Filter "route.ts" | 
    Where-Object { $_.Directory.Name -match '\[' }

Write-Host "Found $($routeFiles.Count) route files with dynamic segments"

foreach ($file in $routeFiles) {
    try {
        Fix-RouteFile -filePath $file.FullName
    }
    catch {
        Write-Host "Error processing $($file.FullName): $_"
    }
}

Write-Host "`nDone! Fixed route files."
