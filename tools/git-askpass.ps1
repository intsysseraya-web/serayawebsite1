$promptText = $args -join " "

if ($promptText -match "(?i)username") {
  if ([string]::IsNullOrWhiteSpace($env:SERAYA_GITHUB_USERNAME)) {
    "x-access-token"
  } else {
    $env:SERAYA_GITHUB_USERNAME
  }
  exit 0
}

if ([string]::IsNullOrWhiteSpace($env:SERAYA_GITHUB_TOKEN)) {
  exit 1
}

$env:SERAYA_GITHUB_TOKEN
exit 0
