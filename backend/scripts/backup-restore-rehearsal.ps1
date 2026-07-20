$ErrorActionPreference = 'Stop'
$container = 'saxlem-postgres-development'
$admin = 'saxlem_dev_admin'
$source = 'saxlem_development'
$restore = 'saxlem_restore_rehearsal'
$containerBackup = '/tmp/saxlem-development-rehearsal.dump'
$backupDirectory = Join-Path $PSScriptRoot '..\.backups'
$hostBackup = Join-Path $backupDirectory 'saxlem-development-rehearsal.dump'

if ($restore -ne 'saxlem_restore_rehearsal') { throw 'Unsafe restore target.' }
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null

try {
  docker exec $container pg_dump -U $admin -d $source -Fc -f $containerBackup
  if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed.' }
  docker cp "${container}:${containerBackup}" $hostBackup
  if ($LASTEXITCODE -ne 0) { throw 'docker cp failed.' }
  docker exec $container dropdb -U $admin --if-exists $restore
  docker exec $container createdb -U $admin $restore
  docker exec $container pg_restore -U $admin -d $restore --no-owner $containerBackup
  if ($LASTEXITCODE -ne 0) { throw 'pg_restore failed.' }
  $count = docker exec $container psql -U $admin -d $restore -Atc 'SELECT count(*) FROM organizations;'
  if ([int]$count -lt 1) { throw 'Restore verification found no foundation organization.' }
  Write-Output "Local backup and restore verified ($count organization record)."
}
finally {
  docker exec $container dropdb -U $admin --if-exists $restore | Out-Null
  docker exec $container rm -f $containerBackup | Out-Null
}
