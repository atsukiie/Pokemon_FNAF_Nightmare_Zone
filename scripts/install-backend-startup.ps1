$ErrorActionPreference = 'Stop'
$taskName = 'NightmareZoneDashboardBackend'
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$supervisor = (Resolve-Path (Join-Path $PSScriptRoot 'keep-backend-running.ps1')).Path
$arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$supervisor`""
$action = New-ScheduledTaskAction -Execute $powershell -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Hidden

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Keeps the local Nightmare Zone dashboard backend healthy on port 3002.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output "Installed and started $taskName for $user."
