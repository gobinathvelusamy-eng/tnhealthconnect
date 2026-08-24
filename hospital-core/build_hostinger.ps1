$source = "C:\Users\ASUS\Herd\new-hospital-manage"
$buildDir = "C:\Users\ASUS\Herd\new-hospital-manage\hostinger_build"
$appDir = "$buildDir\hospital_core"
$pubDir = "$buildDir\public_html"

Write-Host "Starting Hostinger build process..."

if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
New-Item -ItemType Directory -Path $appDir | Out-Null
New-Item -ItemType Directory -Path $pubDir | Out-Null

$exclude = @("node_modules", ".git", "public", "hostinger_build", "tests", "hostinger_release.zip", "test-tailwind", ".vscode", ".agents", ".ai", "build_hostinger.ps1")
Write-Host "Copying core files..."
Get-ChildItem -Path $source | Where-Object { $_.Name -notin $exclude } | Copy-Item -Destination $appDir -Recurse -Force

Write-Host "Copying public files..."
Copy-Item -Path "$source\public\*" -Destination $pubDir -Recurse -Force

Write-Host "Updating index.php paths..."
$indexPath = "$pubDir\index.php"
$indexContent = Get-Content $indexPath -Raw
$indexContent = $indexContent -replace "__DIR__\.'/../storage", "__DIR__.'/../hospital_core/storage"
$indexContent = $indexContent -replace "__DIR__\.'/../vendor", "__DIR__.'/../hospital_core/vendor"
$indexContent = $indexContent -replace "__DIR__\.'/../bootstrap", "__DIR__.'/../hospital_core/bootstrap"
Set-Content -Path $indexPath -Value $indexContent

Write-Host "Creating zip archive..."
if (Test-Path "$source\hostinger_release.zip") { Remove-Item -Force "$source\hostinger_release.zip" }
Compress-Archive -Path "$buildDir\*" -DestinationPath "$source\hostinger_release.zip" -Force

Write-Host "Build complete! Archive generated at: $source\hostinger_release.zip"
