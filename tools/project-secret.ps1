$ErrorActionPreference = "Stop"

function Get-ProjectRoot {
  return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
}

function Get-ProjectGithubSecret {
  $root = Get-ProjectRoot
  $secretPath = Join-Path $root ".secret.json"

  if (-not (Test-Path -LiteralPath $secretPath -PathType Leaf)) {
    throw "Missing $secretPath. Copy .secret.example.json to .secret.json and paste the project PAT."
  }

  try {
    $config = Get-Content -Raw -LiteralPath $secretPath | ConvertFrom-Json
  } catch {
    throw "Invalid JSON in $secretPath. $($_.Exception.Message)"
  }

  if (-not $config.github) {
    throw "Missing 'github' object in $secretPath."
  }

  $token = [string]$config.github.token
  if ([string]::IsNullOrWhiteSpace($token) -or $token.Trim() -eq "PASTE_PROJECT_PAT_HERE") {
    throw "Missing GitHub PAT in $secretPath. Paste the project token into github.token."
  }

  $hostName = [string]$config.github.host
  if ([string]::IsNullOrWhiteSpace($hostName)) {
    $hostName = "github.com"
  }

  $userName = [string]$config.github.username
  if ([string]::IsNullOrWhiteSpace($userName)) {
    $userName = "x-access-token"
  }

  return [pscustomobject]@{
    Root = $root
    Path = $secretPath
    Host = $hostName.Trim()
    Username = $userName.Trim()
    Token = $token.Trim()
  }
}
