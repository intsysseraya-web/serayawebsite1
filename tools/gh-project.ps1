param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$GhArgs
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\project-secret.ps1"

if (-not $GhArgs -or $GhArgs.Count -eq 0) {
  Write-Error "Usage: .\tools\gh-project.ps1 <gh arguments>. Example: .\tools\gh-project.ps1 pr status"
  exit 2
}

try {
  $secret = Get-ProjectGithubSecret
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 2
}
$oldGhToken = $env:GH_TOKEN
$oldGhHost = $env:GH_HOST
$exitCode = 0

try {
  $env:GH_TOKEN = $secret.Token
  $env:GH_HOST = $secret.Host
  & gh @GhArgs
  $exitCode = $LASTEXITCODE
} finally {
  if ($null -eq $oldGhToken) {
    Remove-Item Env:\GH_TOKEN -ErrorAction SilentlyContinue
  } else {
    $env:GH_TOKEN = $oldGhToken
  }

  if ($null -eq $oldGhHost) {
    Remove-Item Env:\GH_HOST -ErrorAction SilentlyContinue
  } else {
    $env:GH_HOST = $oldGhHost
  }
}

exit $exitCode
