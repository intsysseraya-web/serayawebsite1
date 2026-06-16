param(
  [string]$SourcePath = "H:\brep\baytech\seraya",
  [string]$TargetPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path,
  [switch]$Apply,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if ($Apply -and $DryRun) {
  throw "Use either -Apply or -DryRun, not both."
}

$IsDryRun = -not $Apply

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

function Join-NormalizedPath {
  param(
    [string]$BasePath,
    [string]$RelativePath
  )

  return [System.IO.Path]::GetFullPath((Join-Path $BasePath $RelativePath))
}

function Assert-PathWithin {
  param(
    [string]$Path,
    [string]$Root,
    [string]$Label
  )

  $FullPath = [System.IO.Path]::GetFullPath($Path)
  $FullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd("\", "/")
  $Prefix = $FullRoot + [System.IO.Path]::DirectorySeparatorChar

  if (($FullPath -ne $FullRoot) -and (-not $FullPath.StartsWith($Prefix, [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "$Label escaped root: $FullPath"
  }
}

function Ensure-ParentDirectory {
  param([string]$Path)

  $Parent = Split-Path -Parent $Path
  if ($Parent -and (-not (Test-Path -LiteralPath $Parent -PathType Container))) {
    New-Item -ItemType Directory -Force -Path $Parent | Out-Null
  }
}

function Remove-TargetEntry {
  param(
    [string]$Root,
    [string]$RelativePath,
    [bool]$PreviewOnly
  )

  $Target = Join-NormalizedPath $Root $RelativePath
  Assert-PathWithin $Target $Root "Cleanup target"

  if (-not (Test-Path -LiteralPath $Target)) {
    return "skip remove missing: $RelativePath"
  }

  if ($PreviewOnly) {
    return "would remove: $RelativePath"
  }

  Remove-Item -LiteralPath $Target -Recurse -Force
  return "removed: $RelativePath"
}

function Copy-SyncEntry {
  param(
    [string]$SourceRoot,
    [string]$TargetRoot,
    [string]$RelativePath,
    [ValidateSet("File", "Directory")]
    [string]$Kind,
    [bool]$PreviewOnly
  )

  $Source = Join-NormalizedPath $SourceRoot $RelativePath
  $Target = Join-NormalizedPath $TargetRoot $RelativePath
  Assert-PathWithin $Source $SourceRoot "Source"
  Assert-PathWithin $Target $TargetRoot "Target"

  if (-not (Test-Path -LiteralPath $Source)) {
    return "skip copy missing: $RelativePath"
  }

  if ($Kind -eq "File" -and (-not (Test-Path -LiteralPath $Source -PathType Leaf))) {
    throw "Expected source file but found something else: $Source"
  }

  if ($Kind -eq "Directory" -and (-not (Test-Path -LiteralPath $Source -PathType Container))) {
    throw "Expected source directory but found something else: $Source"
  }

  if ($PreviewOnly) {
    return "would copy $($Kind.ToLowerInvariant()): $RelativePath"
  }

  if ($Kind -eq "Directory") {
    if (Test-Path -LiteralPath $Target) {
      Remove-Item -LiteralPath $Target -Recurse -Force
    }
    Ensure-ParentDirectory $Target
    Copy-Item -LiteralPath $Source -Destination $Target -Recurse -Force
  } else {
    Ensure-ParentDirectory $Target
    Copy-Item -LiteralPath $Source -Destination $Target -Force
  }

  return "copied $($Kind.ToLowerInvariant()): $RelativePath"
}

function Ensure-IgnoreLine {
  param(
    [string]$Path,
    [string]$Line
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return
  }

  $Existing = @(Get-Content -LiteralPath $Path)
  if ($Existing -contains $Line) {
    return
  }

  $Updated = @($Existing + $Line)
  Set-Content -LiteralPath $Path -Value $Updated -Encoding utf8
}

function Update-EslintIgnores {
  param([string]$TargetRoot)

  $EslintPath = Join-NormalizedPath $TargetRoot "eslint.config.js"
  if (-not (Test-Path -LiteralPath $EslintPath -PathType Leaf)) {
    return "skip local eslint ignore patch missing: eslint.config.js"
  }

  $Content = Get-Content -LiteralPath $EslintPath -Raw
  $IgnoreConfig = '{ ignores: ["dist", "dist-ssr", ".output", ".vinxi", ".tanstack", ".nitro", ".wrangler", ".worktrees"] }'
  $Pattern = '\{\s*ignores:\s*\[[^\]]*\]\s*\}'

  if ($Content -notmatch $Pattern) {
    return "skip local eslint ignore patch no ignore block: eslint.config.js"
  }

  $Updated = [System.Text.RegularExpressions.Regex]::Replace($Content, $Pattern, $IgnoreConfig, 1)
  Set-Content -LiteralPath $EslintPath -Value $Updated -Encoding utf8
  return "patched local eslint ignores: eslint.config.js"
}

function Apply-TargetLocalAdjustments {
  param([string]$TargetRoot)

  $Results = New-Object System.Collections.Generic.List[string]

  $PrettierIgnorePath = Join-NormalizedPath $TargetRoot ".prettierignore"
  foreach ($Line in @(".worktrees", ".tanstack", ".nitro", ".wrangler")) {
    Ensure-IgnoreLine -Path $PrettierIgnorePath -Line $Line
  }
  if (Test-Path -LiteralPath $PrettierIgnorePath -PathType Leaf) {
    $Results.Add("patched local prettier ignores: .prettierignore")
  } else {
    $Results.Add("skip local prettier ignore patch missing: .prettierignore")
  }

  $Results.Add((Update-EslintIgnores -TargetRoot $TargetRoot))
  return $Results
}

$SourceRoot = Resolve-ExistingDirectory $SourcePath "SourcePath"
$TargetRoot = Resolve-ExistingDirectory $TargetPath "TargetPath"

if ($SourceRoot -eq $TargetRoot) {
  throw "SourcePath and TargetPath must be different."
}

$CleanupEntries = @(
  "about.html",
  "assets\brand",
  "case-study.html",
  "favicon.ico",
  "favicon.svg",
  "index.html",
  "script.js",
  "styles.css",
  "works.html"
)

$SyncEntries = @(
  @{ Path = ".lovable\project.json"; Kind = "File" },
  @{ Path = ".prettierignore"; Kind = "File" },
  @{ Path = ".prettierrc"; Kind = "File" },
  @{ Path = "bun.lock"; Kind = "File" },
  @{ Path = "bunfig.toml"; Kind = "File" },
  @{ Path = "components.json"; Kind = "File" },
  @{ Path = "eslint.config.js"; Kind = "File" },
  @{ Path = "package-lock.json"; Kind = "File" },
  @{ Path = "package.json"; Kind = "File" },
  @{ Path = "public"; Kind = "Directory" },
  @{ Path = "src"; Kind = "Directory" },
  @{ Path = "tsconfig.json"; Kind = "File" },
  @{ Path = "vite.config.ts"; Kind = "File" }
)

$Mode = if ($IsDryRun) { "DRY-RUN" } else { "APPLY" }
Write-Host "sync-lovable mode: $Mode"
Write-Host "source: $SourceRoot"
Write-Host "target: $TargetRoot"

$Operations = New-Object System.Collections.Generic.List[string]

foreach ($Entry in $CleanupEntries) {
  $Operations.Add((Remove-TargetEntry -Root $TargetRoot -RelativePath $Entry -PreviewOnly $IsDryRun))
}

foreach ($Entry in $SyncEntries) {
  $Operations.Add((Copy-SyncEntry -SourceRoot $SourceRoot -TargetRoot $TargetRoot -RelativePath $Entry.Path -Kind $Entry.Kind -PreviewOnly $IsDryRun))
}

if ($IsDryRun) {
  $Operations.Add("would patch target-local eslint/prettier ignores")
} else {
  foreach ($Result in (Apply-TargetLocalAdjustments -TargetRoot $TargetRoot)) {
    $Operations.Add($Result)
  }
}

$Operations | ForEach-Object { Write-Host $_ }

if ($IsDryRun) {
  Write-Host "Dry-run complete. Re-run with -Apply to write changes."
} else {
  Write-Host "Sync complete."
}
