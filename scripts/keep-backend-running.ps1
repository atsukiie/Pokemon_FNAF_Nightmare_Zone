$ErrorActionPreference = 'SilentlyContinue'
$backendDir = (Resolve-Path (Join-Path $PSScriptRoot '..\backend')).Path
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
$entry = Join-Path $backendDir 'dist\main.js'
$healthUrl = 'http://127.0.0.1:3002/api/health'
$supervisorLog = Join-Path $backendDir 'backend-supervisor.log'
$stdoutLog = Join-Path $backendDir 'backend-runtime.out.log'
$stderrLog = Join-Path $backendDir 'backend-runtime.err.log'
$failures = 0

function Write-SupervisorLog([string]$message) {
  Add-Content -LiteralPath $supervisorLog -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $message"
}

function Test-BackendPort {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $connect = $client.BeginConnect('127.0.0.1', 3002, $null, $null)
    if (-not $connect.AsyncWaitHandle.WaitOne(1500)) { return $false }
    $client.EndConnect($connect)
    return $client.Connected
  } catch { return $false }
  finally { $client.Dispose() }
}

while ($true) {
  if (Test-BackendPort) {
    try {
      $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
      if ($health.status -eq 'ok' -and $health.service -eq 'nightmare-zone-api') {
        $failures = 0
        Start-Sleep -Seconds 8
        continue
      }
    } catch { }
    # A listener exists but is not healthy; avoid starting a second process on its port.
    Start-Sleep -Seconds 5
    continue
  }

  if (-not (Test-Path -LiteralPath $entry)) {
    Write-SupervisorLog 'Backend build output is missing; trying npm build.'
    $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $npm) {
      Write-SupervisorLog 'npm.cmd was not found; retrying shortly.'
      Start-Sleep -Seconds 30
      continue
    }
    $build = Start-Process -FilePath $npm -ArgumentList @('run', 'build') -WorkingDirectory $backendDir -WindowStyle Hidden -Wait -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    if ($build.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $entry)) {
      Write-SupervisorLog "Backend build failed with exit code $($build.ExitCode); retrying shortly."
      Start-Sleep -Seconds 30
      continue
    }
  }

  try {
    $child = Start-Process -FilePath $nodeExe -ArgumentList @('dist/main.js') -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
    $healthy = $false
    for ($second = 0; $second -lt 25; $second++) {
      if ($child.HasExited) { break }
      try {
        $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
        if ($health.status -eq 'ok' -and $health.service -eq 'nightmare-zone-api') { $healthy = $true; break }
      } catch { }
      Start-Sleep -Seconds 1
    }
    if ($healthy) {
      $failures = 0
      Write-SupervisorLog 'Backend started and health check passed.'
    } else {
      $failures++
      Write-SupervisorLog "Backend did not become healthy; retry attempt $failures. See backend-runtime logs."
      $delay = [Math]::Min(60, [int][Math]::Pow(2, [Math]::Min($failures, 6)))
      Start-Sleep -Seconds $delay
    }
  } catch {
    $failures++
    Write-SupervisorLog "Backend launch failed; retry attempt $failures."
    Start-Sleep -Seconds ([Math]::Min(60, [int][Math]::Pow(2, [Math]::Min($failures, 6))))
  }
}
