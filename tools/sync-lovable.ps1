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

function Write-Utf8LfFile {
  param(
    [string]$Path,
    [string]$Content
  )

  $Normalized = $Content -replace "`r`n", "`n"
  $Normalized = $Normalized -replace "`r", "`n"
  $Utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
  [System.IO.File]::WriteAllText($Path, $Normalized, $Utf8NoBom)
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

  $Updated = (($Existing + $Line) -join "`n") + "`n"
  Write-Utf8LfFile -Path $Path -Content $Updated
}

function Update-EslintIgnores {
  param([string]$TargetRoot)

  $EslintPath = Join-NormalizedPath $TargetRoot "eslint.config.js"
  if (-not (Test-Path -LiteralPath $EslintPath -PathType Leaf)) {
    return "skip local eslint ignore patch missing: eslint.config.js"
  }

  $Content = Get-Content -LiteralPath $EslintPath -Raw
  $IgnoreConfig = @(
    "{",
    "    ignores: [",
    "      `"dist`",",
    "      `"dist-ssr`",",
    "      `".output`",",
    "      `".vinxi`",",
    "      `".tanstack`",",
    "      `".nitro`",",
    "      `".wrangler`",",
    "      `".worktrees`",",
    "    ],",
    "  }"
  ) -join "`n"
  $Pattern = '\{\s*ignores:\s*\[[^\]]*\]\s*\}'

  if ($Content -notmatch $Pattern) {
    return "skip local eslint ignore patch no ignore block: eslint.config.js"
  }

  $Updated = [System.Text.RegularExpressions.Regex]::Replace($Content, $Pattern, $IgnoreConfig, 1)
  Write-Utf8LfFile -Path $EslintPath -Content $Updated
  return "patched local eslint ignores: eslint.config.js"
}

function Update-PackagePrebuild {
  param([string]$TargetRoot)

  $PackagePath = Join-NormalizedPath $TargetRoot "package.json"
  if (-not (Test-Path -LiteralPath $PackagePath -PathType Leaf)) {
    return "skip local package prebuild patch missing: package.json"
  }

  $Content = Get-Content -LiteralPath $PackagePath -Raw
  $Package = $Content | ConvertFrom-Json
  $PrebuildCommand = "node tools/ensure-linux-native-deps.cjs"

  if (-not $Package.PSObject.Properties["scripts"]) {
    $Package | Add-Member -NotePropertyName "scripts" -NotePropertyValue ([pscustomobject]@{})
  }

  $UpdatedScripts = [ordered]@{}
  $Inserted = $false

  foreach ($Property in $Package.scripts.PSObject.Properties) {
    if ($Property.Name -eq "prebuild") {
      $UpdatedScripts["prebuild"] = $PrebuildCommand
      $Inserted = $true
      continue
    }

    if ((-not $Inserted) -and ($Property.Name -eq "build")) {
      $UpdatedScripts["prebuild"] = $PrebuildCommand
      $Inserted = $true
    }

    $UpdatedScripts[$Property.Name] = $Property.Value
  }

  if (-not $Inserted) {
    $UpdatedScripts["prebuild"] = $PrebuildCommand
  }

  $Package.scripts = [pscustomobject]$UpdatedScripts
  $PackageJson = ($Package | ConvertTo-Json -Depth 100) + "`n"
  Write-Utf8LfFile -Path $PackagePath -Content $PackageJson
  return "patched local package prebuild: package.json"
}

function Update-ViteCloudflarePagesPreset {
  param([string]$TargetRoot)

  $VitePath = Join-NormalizedPath $TargetRoot "vite.config.ts"
  if (-not (Test-Path -LiteralPath $VitePath -PathType Leaf)) {
    return "skip local vite cloudflare pages patch missing: vite.config.ts"
  }

  $Content = Get-Content -LiteralPath $VitePath -Raw
  $NewLine = if ($Content.Contains("`r`n")) { "`r`n" } else { "`n" }
  $Updated = $Content -replace "You can pass additional config via defineConfig\(\{ vite: \{ \.\.\. \}, etc\.\.\. \}\) if needed\.", "You can pass additional config via defineConfig({ vite: { ... }, nitro: { ... }, etc... }) if needed."

  if ($Updated -match 'preset\s*:\s*["'']cloudflare_pages["'']') {
    if ($Updated -ne $Content) {
      Write-Utf8LfFile -Path $VitePath -Content $Updated
      return "patched local vite cloudflare pages comment: vite.config.ts"
    }
    return "local vite cloudflare pages preset already present: vite.config.ts"
  }

  $NitroTruePattern = '(?m)^([ \t]*)nitro\s*:\s*true\s*,\s*$'
  if ($Updated -match $NitroTruePattern) {
    $Updated = [System.Text.RegularExpressions.Regex]::Replace(
      $Updated,
      $NitroTruePattern,
      {
        param($Match)
        $Indent = $Match.Groups[1].Value
        return "$Indent" + "nitro: {" + $NewLine +
          "$Indent" + "  preset: `"cloudflare_pages`"," + $NewLine +
          "$Indent" + "},"
      },
      1
    )
  } elseif ($Updated -match '(?m)^[ \t]*nitro\s*:') {
    throw "vite.config.ts already has a nitro config without cloudflare_pages. Update the target-local patch manually."
  } else {
    $DefineConfigPattern = 'export\s+default\s+defineConfig\(\s*\{'
    if ($Updated -notmatch $DefineConfigPattern) {
      return "skip local vite cloudflare pages patch unsupported shape: vite.config.ts"
    }

    $Updated = [System.Text.RegularExpressions.Regex]::Replace(
      $Updated,
      $DefineConfigPattern,
      {
        param($Match)
        return $Match.Value + $NewLine +
          "  nitro: {" + $NewLine +
          "    preset: `"cloudflare_pages`"," + $NewLine +
          "  },"
      },
      1
    )
  }

  Write-Utf8LfFile -Path $VitePath -Content $Updated
  return "patched local vite cloudflare pages preset: vite.config.ts"
}

function Update-IndexEmptyCatch {
  param([string]$TargetRoot)

  $IndexPath = Join-NormalizedPath $TargetRoot "src\routes\index.tsx"
  if (-not (Test-Path -LiteralPath $IndexPath -PathType Leaf)) {
    return "skip local index empty catch patch missing: src/routes/index.tsx"
  }

  $Content = Get-Content -LiteralPath $IndexPath -Raw
  $Pattern = '(?m)^([ \t]*)\}\s*catch\s*\{\s*\}'
  if ($Content -notmatch $Pattern) {
    return "local index empty catch patch not needed: src/routes/index.tsx"
  }

  $Updated = [System.Text.RegularExpressions.Regex]::Replace(
    $Content,
    $Pattern,
    {
      param($Match)
      $Indent = $Match.Groups[1].Value
      return "$Indent" + "} catch {" + "`n" +
        "$Indent" + "  // Ignore malformed query strings and keep the default animated hero." + "`n" +
        "$Indent" + "}"
    },
    1
  )

  Write-Utf8LfFile -Path $IndexPath -Content $Updated
  return "patched local index empty catch: src/routes/index.tsx"
}

function Normalize-TargetTextLineEndings {
  param([string]$TargetRoot)

  $SkipDirNames = @(
    ".git",
    "node_modules",
    "dist",
    "dist-ssr",
    ".output",
    ".vinxi",
    ".tanstack",
    ".nitro",
    ".wrangler",
    ".worktrees"
  )
  $TextExtensions = @(".html", ".css", ".js", ".cjs", ".json", ".md", ".ts", ".tsx", ".toml")
  $TextFileNames = @(".gitignore", ".gitattributes", ".npmrc", ".prettierignore", ".prettierrc")
  $RootFull = (Resolve-Path -LiteralPath $TargetRoot).Path.TrimEnd("\", "/")
  $ChangedCount = 0

  foreach ($File in (Get-ChildItem -LiteralPath $RootFull -Recurse -Force -File)) {
    $Relative = $File.FullName.Substring($RootFull.Length).TrimStart("\", "/")
    $Parts = $Relative -split '[\\/]'
    $ShouldSkip = $false

    foreach ($Part in $Parts) {
      if ($SkipDirNames -contains $Part) {
        $ShouldSkip = $true
        break
      }
    }

    if ($ShouldSkip) {
      continue
    }

    $Extension = $File.Extension.ToLowerInvariant()
    if ((-not ($TextExtensions -contains $Extension)) -and (-not ($TextFileNames -contains $File.Name))) {
      continue
    }

    $Content = [System.IO.File]::ReadAllText($File.FullName)
    if ($Content.Contains("`r")) {
      Write-Utf8LfFile -Path $File.FullName -Content $Content
      $ChangedCount += 1
    }
  }

  return "normalized local text line endings: $ChangedCount file(s)"
}

function Apply-TargetLocalAdjustments {
  param([string]$TargetRoot)

  $Results = New-Object System.Collections.Generic.List[string]

  $PrettierIgnorePath = Join-NormalizedPath $TargetRoot ".prettierignore"
  foreach ($Line in @(".output", ".worktrees", ".tanstack", ".nitro", ".wrangler")) {
    Ensure-IgnoreLine -Path $PrettierIgnorePath -Line $Line
  }
  if (Test-Path -LiteralPath $PrettierIgnorePath -PathType Leaf) {
    $Results.Add("patched local prettier ignores: .prettierignore")
  } else {
    $Results.Add("skip local prettier ignore patch missing: .prettierignore")
  }

  $Results.Add((Update-EslintIgnores -TargetRoot $TargetRoot))
  $Results.Add((Update-PackagePrebuild -TargetRoot $TargetRoot))
  $Results.Add((Update-ViteCloudflarePagesPreset -TargetRoot $TargetRoot))
  $Results.Add((Update-IndexEmptyCatch -TargetRoot $TargetRoot))
  $Results.Add((Normalize-TargetTextLineEndings -TargetRoot $TargetRoot))
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
