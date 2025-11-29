# Branch sync helper script - PowerShell
# Usage: .\branch-sync.ps1 -sourceRepoUrl <url> -targetRepoUrl <url>
param(
    [Parameter(Mandatory=$true)]
    [string]$sourceRepoUrl,

    [Parameter(Mandatory=$true)]
    [string]$targetRepoUrl
)

# This script will mirror branches from source to target. Use carefully.
Write-Host "Cloning source repo (shallow) ..."
$tmppath = Join-Path -Path $env:TEMP -ChildPath ([System.Guid]::NewGuid().ToString())
git clone --mirror $sourceRepoUrl $tmppath
if ($LASTEXITCODE -ne 0) { Write-Host "clone failed"; exit 1 }

Set-Location $tmppath
Write-Host "Pushing to target repo (mirror) ..."
git remote set-url --push origin $targetRepoUrl
git push --mirror
if ($LASTEXITCODE -ne 0) { Write-Host "push failed"; exit 1 }

Write-Host "Cleanup and done"
Remove-Item -Recurse -Force $tmppath
