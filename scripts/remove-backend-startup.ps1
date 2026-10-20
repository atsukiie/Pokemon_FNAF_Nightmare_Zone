$taskName = 'NightmareZoneDashboardBackend'
Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
Write-Output "Removed $taskName. The backend process already running will continue until it exits or is stopped."
