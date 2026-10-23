$backup = 'f:\SAAS_BACKUPS\snapshot_20261019_085939'
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
    'postcss.config.mjs'
)

foreach ($item in $items) {
    $src = Join-Path $backup $item
    $dest = Join-Path 'f:\SAAS' $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dest -Recurse -Force
        Write-Output "Restored $item"
    }
}

Write-Output "SUCCESS: Restored from $backup"
