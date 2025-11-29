<#
Selective branch sync helper (PowerShell)
Usage:
.\branch-sync-selective.ps1 -sourceRepoUrl https://github.com/OLD_ORG/old-repo.git -targetRepoUrl https://github.com/YOUR_ORG/torqued-affiliates.git -branches master,feature/x
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$sourceRepoUrl,

  [Parameter(Mandatory=$true)]
  [string]$targetRepoUrl,

  [Parameter(Mandatory=$false)]
  [string]$branches = "master"
)

$branchesToPush = $branches -split ',' | ForEach-Object { $_.Trim() }
$tmpdir = Join-Path -Path $env:TEMP -ChildPath ([System.Guid]::NewGuid().ToString())

Write-Host "Cloning source repo to $tmpdir"
git clone $sourceRepoUrl $tmpdir
if ($LASTEXITCODE -ne 0) { Write-Error "clone failed"; exit 1 }

Set-Location $tmpdir
Write-Host "Adding target remote and pushing selected branches..."
git remote add target $targetRepoUrl
foreach ($b in $branchesToPush) {
  Write-Host "Pushing branch: $b"
  git push target refs/heads/$b:refs/heads/$b
  if ($LASTEXITCODE -ne 0) { Write-Error "push failed for $b" }
}

Write-Host "Optionally push tags: git push target --tags"

Write-Host "Cleaning up"
Set-Location $PSScriptRoot
Remove-Item -Recurse -Force $tmpdir
