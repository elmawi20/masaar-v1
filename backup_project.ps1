$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = "f:\SAAS_BACKUPS\snapshot_$ts"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$items = @(
    'app',
    'components',
    'context',
    'lib',
    'types',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'next.config.ts',
    'postcss.config.mjs',
    '.gitignore'
)

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination $backupDir -Recurse -Force
    }
}

Write-Output "SUCCESS: Backup created at $backupDir"
