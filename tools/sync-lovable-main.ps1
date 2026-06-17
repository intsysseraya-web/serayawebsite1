param(
  [string]$SourcePath = "H:\brep\baytech\seraya",
  [string]$TargetPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path,
  [string]$CommitMessage = "Sync Lovable main"
)

$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SyncScript = Join-Path $ScriptRoot "sync-lovable.ps1"

function Resolve-ExistingDirectory {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "$Label does not exist or is not a directory: $Path"
  }

  return (Resolve-Path -LiteralPath $Path).Path.TrimEnd("\", "/")
}

function Invoke-Git {
  param(
    [string]$RepoPath,
    [string[]]$GitArgs
  )

  & git -C $RepoPath @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git failed in $RepoPath`: git $($GitArgs -join ' ')"
  }
}

function Invoke-GitOutput {
  param(
    [string]$RepoPath,
    [string[]]$GitArgs
  )

  $Output = & git -C $RepoPath @GitArgs
  if ($LASTEXITCODE -ne 0) {
    throw "git failed in $RepoPath`: git $($GitArgs -join ' ')"
  }

  return @($Output)
}

function Get-GitStatusLines {
  param(
    [string]$RepoPath,
    [string]$UntrackedMode = "normal"
  )

  return @(Invoke-GitOutput -RepoPath $RepoPath -GitArgs @("status", "--porcelain", "--untracked-files=$UntrackedMode"))
}

$SourceRoot = Resolve-ExistingDirectory $SourcePath "SourcePath"
$TargetRoot = Resolve-ExistingDirectory $TargetPath "TargetPath"

if (-not (Test-Path -LiteralPath $SyncScript -PathType Leaf)) {
  throw "Missing sync script: $SyncScript"
}

Write-Host "sync-lovable-main"
Write-Host "source: $SourceRoot"
Write-Host "target: $TargetRoot"

$TargetStatus = Get-GitStatusLines -RepoPath $TargetRoot
if ($TargetStatus.Count -gt 0) {
  Write-Host "Target repo has uncommitted changes:" -ForegroundColor Yellow
  $TargetStatus | ForEach-Object { Write-Host $_ }
  throw "Target repo must be clean before running sync-lovable-main.ps1."
}

$SourceBranch = (Invoke-GitOutput -RepoPath $SourceRoot -GitArgs @("rev-parse", "--abbrev-ref", "HEAD") | Select-Object -First 1)
if ($SourceBranch -ne "main") {
  throw "Source repo must be on main before pulling. Current branch: $SourceBranch"
}

$SourceStatus = Get-GitStatusLines -RepoPath $SourceRoot -UntrackedMode "all"
$StashedSource = $false
if ($SourceStatus.Count -gt 0) {
  Write-Host "Source repo is dirty; stashing before pull:" -ForegroundColor Yellow
  $SourceStatus | ForEach-Object { Write-Host $_ }

  $Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  Invoke-Git -RepoPath $SourceRoot -GitArgs @("stash", "push", "-u", "-m", "codex sync-lovable-main $Stamp")
  $StashedSource = $true
}

Invoke-Git -RepoPath $SourceRoot -GitArgs @("pull", "--ff-only", "origin", "main")

& $SyncScript -SourcePath $SourceRoot -TargetPath $TargetRoot -Apply
if ($LASTEXITCODE -ne 0) {
  throw "sync-lovable.ps1 failed."
}

$PostSyncStatus = Get-GitStatusLines -RepoPath $TargetRoot
if ($PostSyncStatus.Count -eq 0) {
  Write-Host "No target changes after syncing Lovable main."
  if ($StashedSource) {
    $StashLine = Invoke-GitOutput -RepoPath $SourceRoot -GitArgs @("stash", "list", "-n", "1") | Select-Object -First 1
    Write-Host "Source stash left in place: $StashLine"
  }
  exit 0
}

Write-Host "Target changes after sync:"
$PostSyncStatus | ForEach-Object { Write-Host $_ }

Invoke-Git -RepoPath $TargetRoot -GitArgs @("add", "-A")

$StagedFiles = Invoke-GitOutput -RepoPath $TargetRoot -GitArgs @("diff", "--cached", "--name-only")
if ($StagedFiles.Count -eq 0) {
  Write-Host "No staged changes to commit."
  exit 0
}

Invoke-Git -RepoPath $TargetRoot -GitArgs @("commit", "-m", $CommitMessage)

if ($StashedSource) {
  $StashLine = Invoke-GitOutput -RepoPath $SourceRoot -GitArgs @("stash", "list", "-n", "1") | Select-Object -First 1
  Write-Host "Source stash left in place: $StashLine"
}

Write-Host "Sync commit created. Run local tests before pushing."
