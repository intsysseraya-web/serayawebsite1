$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SyncScript = Join-Path $ScriptRoot "sync-lovable.ps1"

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw "Assertion failed: $Message"
  }
}

function Write-TestFile {
  param(
    [string]$Path,
    [string]$Content
  )

  $Parent = Split-Path -Parent $Path
  if ($Parent) {
    New-Item -ItemType Directory -Force -Path $Parent | Out-Null
  }
  Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
}

function Get-TreeSnapshot {
  param([string]$Root)

  $RootFull = (Resolve-Path -LiteralPath $Root).Path.TrimEnd("\", "/")
  $Rows = Get-ChildItem -LiteralPath $RootFull -Recurse -Force -File |
    Sort-Object FullName |
    ForEach-Object {
      $Relative = $_.FullName.Substring($RootFull.Length).TrimStart("\", "/")
      $Hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
      "$Relative=$Hash"
    }

  return ($Rows -join "`n")
}

function Assert-PathExists {
  param([string]$Path)
  Assert-True (Test-Path -LiteralPath $Path) "Expected path to exist: $Path"
}

function Assert-PathMissing {
  param([string]$Path)
  Assert-True (-not (Test-Path -LiteralPath $Path)) "Expected path to be missing: $Path"
}

function Assert-FileContent {
  param(
    [string]$Path,
    [string]$Expected
  )

  Assert-PathExists $Path
  $Actual = (Get-Content -LiteralPath $Path -Raw).TrimEnd("`r", "`n")
  Assert-True ($Actual -eq $Expected) "Unexpected content in $Path"
}

Assert-PathExists $SyncScript

$TempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("seraya-sync-test-" + [guid]::NewGuid().ToString("N"))
$Source = Join-Path $TempRoot "lovable-source"
$Target = Join-Path $TempRoot "target-repo"

try {
  New-Item -ItemType Directory -Force -Path $Source, $Target | Out-Null

  Write-TestFile (Join-Path $Source "src\routes\index.tsx") "lovable home route"
  Write-TestFile (Join-Path $Source "src\styles.css") "lovable css"
  Write-TestFile (Join-Path $Source "public\legacy\script.js") "lovable legacy script"
  Write-TestFile (Join-Path $Source "public\static\logo.svg") "<svg>lovable</svg>"
  Write-TestFile (Join-Path $Source ".lovable\project.json") "{`"template`":`"tanstack`"}"
  Write-TestFile (Join-Path $Source ".lovable\plan.md") "local lovable plan"
  Write-TestFile (Join-Path $Source "package.json") "{`"scripts`":{`"dev`":`"vite dev`"}}"
  Write-TestFile (Join-Path $Source "package-lock.json") "{`"lockfileVersion`":3}"
  Write-TestFile (Join-Path $Source ".prettierrc") "{`"printWidth`":100}"
  Write-TestFile (Join-Path $Source ".prettierignore") "node_modules`ndist"
  Write-TestFile (Join-Path $Source "vite.config.ts") "export default {}"
  Write-TestFile (Join-Path $Source "tsconfig.json") "{`"compilerOptions`":{}}"
  Write-TestFile (Join-Path $Source "eslint.config.js") "export default [{ ignores: [`"dist`", `".output`", `".vinxi`"] }]"
  Write-TestFile (Join-Path $Source "components.json") "{`"$schema`":`"test`"}"
  Write-TestFile (Join-Path $Source "bun.lock") "bun lock"
  Write-TestFile (Join-Path $Source "bunfig.toml") "[install]"
  Write-TestFile (Join-Path $Source "node_modules\pkg\index.js") "dependency"
  Write-TestFile (Join-Path $Source "dist\server\server.js") "generated dist"
  Write-TestFile (Join-Path $Source "old_site\index.html") "old site"
  Write-TestFile (Join-Path $Source ".tanstack\cache.txt") "generated cache"

  Write-TestFile (Join-Path $Target "AGENTS.md") "target agent guide"
  Write-TestFile (Join-Path $Target "_headers") "target headers"
  Write-TestFile (Join-Path $Target "wrangler.toml") "target wrangler"
  Write-TestFile (Join-Path $Target "netlify.toml") "target netlify"
  Write-TestFile (Join-Path $Target "DEPLOY-SPACESHIP.txt") "target deploy notes"
  Write-TestFile (Join-Path $Target ".secret.example.json") "target secret example"
  Write-TestFile (Join-Path $Target ".secret.json") "target real secret"
  Write-TestFile (Join-Path $Target "tools\keep.ps1") "target helper"
  Write-TestFile (Join-Path $Target "README-local.txt") "unknown target file"
  Write-TestFile (Join-Path $Target "index.html") "old static home"
  Write-TestFile (Join-Path $Target "works.html") "old static works"
  Write-TestFile (Join-Path $Target "case-study.html") "old static case"
  Write-TestFile (Join-Path $Target "about.html") "old static about"
  Write-TestFile (Join-Path $Target "styles.css") "old static css"
  Write-TestFile (Join-Path $Target "script.js") "old static js"
  Write-TestFile (Join-Path $Target "favicon.svg") "old favicon"
  Write-TestFile (Join-Path $Target "favicon.ico") "old favicon ico"
  Write-TestFile (Join-Path $Target "assets\brand\old.svg") "old brand"

  $BeforeDryRun = Get-TreeSnapshot $Target
  & $SyncScript -SourcePath $Source -TargetPath $Target -DryRun | Out-Null
  $AfterDryRun = Get-TreeSnapshot $Target
  Assert-True ($BeforeDryRun -eq $AfterDryRun) "Dry-run mutated the target tree"

  & $SyncScript -SourcePath $Source -TargetPath $Target -Apply | Out-Null

  Assert-FileContent (Join-Path $Target "src\routes\index.tsx") "lovable home route"
  Assert-FileContent (Join-Path $Target "src\styles.css") "lovable css"
  Assert-FileContent (Join-Path $Target "public\legacy\script.js") "lovable legacy script"
  Assert-FileContent (Join-Path $Target "public\static\logo.svg") "<svg>lovable</svg>"
  Assert-FileContent (Join-Path $Target ".lovable\project.json") "{`"template`":`"tanstack`"}"
  Assert-FileContent (Join-Path $Target "package.json") "{`"scripts`":{`"dev`":`"vite dev`"}}"
  Assert-FileContent (Join-Path $Target "package-lock.json") "{`"lockfileVersion`":3}"
  Assert-FileContent (Join-Path $Target ".prettierrc") "{`"printWidth`":100}"
  Assert-PathExists (Join-Path $Target ".prettierignore")
  $PrettierIgnore = @(Get-Content -LiteralPath (Join-Path $Target ".prettierignore"))
  Assert-True ($PrettierIgnore -contains ".worktrees") "Expected .prettierignore to ignore .worktrees"
  Assert-FileContent (Join-Path $Target "vite.config.ts") "export default {}"
  Assert-FileContent (Join-Path $Target "tsconfig.json") "{`"compilerOptions`":{}}"
  Assert-PathExists (Join-Path $Target "eslint.config.js")
  $EslintConfig = Get-Content -LiteralPath (Join-Path $Target "eslint.config.js") -Raw
  Assert-True ($EslintConfig.Contains('".worktrees"')) "Expected eslint config to ignore .worktrees"
  Assert-True ($EslintConfig.Contains('".tanstack"')) "Expected eslint config to ignore .tanstack"
  Assert-True ($EslintConfig.Contains('".nitro"')) "Expected eslint config to ignore .nitro"
  Assert-True ($EslintConfig.Contains('".wrangler"')) "Expected eslint config to ignore .wrangler"
  Assert-FileContent (Join-Path $Target "components.json") "{`"$schema`":`"test`"}"
  Assert-FileContent (Join-Path $Target "bun.lock") "bun lock"
  Assert-FileContent (Join-Path $Target "bunfig.toml") "[install]"

  Assert-PathMissing (Join-Path $Target ".lovable\plan.md")
  Assert-PathMissing (Join-Path $Target "node_modules")
  Assert-PathMissing (Join-Path $Target "dist")
  Assert-PathMissing (Join-Path $Target "old_site")
  Assert-PathMissing (Join-Path $Target ".tanstack")

  Assert-FileContent (Join-Path $Target "AGENTS.md") "target agent guide"
  Assert-FileContent (Join-Path $Target "_headers") "target headers"
  Assert-FileContent (Join-Path $Target "wrangler.toml") "target wrangler"
  Assert-FileContent (Join-Path $Target "netlify.toml") "target netlify"
  Assert-FileContent (Join-Path $Target "DEPLOY-SPACESHIP.txt") "target deploy notes"
  Assert-FileContent (Join-Path $Target ".secret.example.json") "target secret example"
  Assert-FileContent (Join-Path $Target ".secret.json") "target real secret"
  Assert-FileContent (Join-Path $Target "tools\keep.ps1") "target helper"
  Assert-FileContent (Join-Path $Target "README-local.txt") "unknown target file"

  Assert-PathMissing (Join-Path $Target "index.html")
  Assert-PathMissing (Join-Path $Target "works.html")
  Assert-PathMissing (Join-Path $Target "case-study.html")
  Assert-PathMissing (Join-Path $Target "about.html")
  Assert-PathMissing (Join-Path $Target "styles.css")
  Assert-PathMissing (Join-Path $Target "script.js")
  Assert-PathMissing (Join-Path $Target "favicon.svg")
  Assert-PathMissing (Join-Path $Target "favicon.ico")
  Assert-PathMissing (Join-Path $Target "assets\brand")

  Write-Host "sync-lovable tests passed"
} finally {
  if (Test-Path -LiteralPath $TempRoot) {
    Remove-Item -LiteralPath $TempRoot -Recurse -Force
  }
}
