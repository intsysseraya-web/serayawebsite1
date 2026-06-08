param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$GitArgs
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\project-secret.ps1"

if (-not $GitArgs -or $GitArgs.Count -eq 0) {
  Write-Error "Usage: .\tools\git-project.ps1 <git arguments>. Example: .\tools\git-project.ps1 fetch origin"
  exit 2
}

try {
  $secret = Get-ProjectGithubSecret
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 2
}
$askPass = Join-Path $PSScriptRoot "git-askpass.cmd"

$oldToken = $env:SERAYA_GITHUB_TOKEN
$oldUser = $env:SERAYA_GITHUB_USERNAME
$oldAskPass = $env:GIT_ASKPASS
$oldPrompt = $env:GIT_TERMINAL_PROMPT
$oldGcmInteractive = $env:GCM_INTERACTIVE
$exitCode = 0

try {
  $env:SERAYA_GITHUB_TOKEN = $secret.Token
  $env:SERAYA_GITHUB_USERNAME = $secret.Username
  $env:GIT_ASKPASS = $askPass
  $env:GIT_TERMINAL_PROMPT = "0"
  $env:GCM_INTERACTIVE = "Never"

  & git `
    -c credential.helper= `
    -c "credential.https://github.com.helper=" `
    -c "credential.https://gist.github.com.helper=" `
    @GitArgs
  $exitCode = $LASTEXITCODE
} finally {
  if ($null -eq $oldToken) {
    Remove-Item Env:\SERAYA_GITHUB_TOKEN -ErrorAction SilentlyContinue
  } else {
    $env:SERAYA_GITHUB_TOKEN = $oldToken
  }

  if ($null -eq $oldUser) {
    Remove-Item Env:\SERAYA_GITHUB_USERNAME -ErrorAction SilentlyContinue
  } else {
    $env:SERAYA_GITHUB_USERNAME = $oldUser
  }

  if ($null -eq $oldAskPass) {
    Remove-Item Env:\GIT_ASKPASS -ErrorAction SilentlyContinue
  } else {
    $env:GIT_ASKPASS = $oldAskPass
  }

  if ($null -eq $oldPrompt) {
    Remove-Item Env:\GIT_TERMINAL_PROMPT -ErrorAction SilentlyContinue
  } else {
    $env:GIT_TERMINAL_PROMPT = $oldPrompt
  }

  if ($null -eq $oldGcmInteractive) {
    Remove-Item Env:\GCM_INTERACTIVE -ErrorAction SilentlyContinue
  } else {
    $env:GCM_INTERACTIVE = $oldGcmInteractive
  }
}

exit $exitCode
