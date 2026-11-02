# Converts ImageGen PNG outputs (in %USERPROFILE%\.qoder\vibe_images) into
# web-friendly JPG files inside the project's images/ folder.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/convert-images.ps1 hero-perfume perfume-01-oud-royal
param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [string[]]$Prefixes
)

Add-Type -AssemblyName System.Drawing

$src  = Join-Path $env:USERPROFILE '.qoder\vibe_images'
$dest = Join-Path $PSScriptRoot '..\images'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]85)

foreach ($p in $Prefixes) {
    $file = Get-ChildItem -Path $src -Filter "$p-*.png" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $file) { Write-Output "MISSING: $p"; continue }

    $img = [System.Drawing.Image]::FromFile($file.FullName)
    $out = Join-Path $dest "$p.jpg"
    $img.Save($out, $jpegCodec, $encParams)
    $img.Dispose()

    $kb = [math]::Round((Get-Item $out).Length / 1KB)
    Write-Output "OK  $($file.Name)  ->  images/$p.jpg  ($kb KB)"
}
