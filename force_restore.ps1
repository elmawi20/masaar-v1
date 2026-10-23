param()
$srcDir = 'f:\SAAS_BACKUPS\snapshot_20261019_085939'
$destDir = 'f:\SAAS'

Get-ChildItem -Path $srcDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($srcDir.Length + 1)
    $destinationPath = Join-Path $destDir $relativePath
    $parentDir = Split-Path $destinationPath -Parent
    if (!(Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $destinationPath -Force
}

Write-Output "ALL FILES RESTORED EXACTLY FROM $srcDir"
