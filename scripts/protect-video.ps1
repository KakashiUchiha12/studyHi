<#
.SYNOPSIS
Encrypts a video file for HLS streaming (Piracy Protection).
.DESCRIPTION
This script takes a video file, generates a random encryption key, and uses FFmpeg to segment the video into encrypted .ts chunks and an .m3u8 playlist.
.PARAMETER InputFile
The path to the source video file (e.g., "video.mp4").
.EXAMPLE
.\protect-video.ps1 -InputFile "my-lesson.mp4"
#>

param (
    [Parameter(Mandatory = $true)]
    [string]$InputFile
)

# 1. Check for FFmpeg
if (-not (Get-Command "ffmpeg" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: FFmpeg is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "-> Please install it via Chocolatey: 'choco install ffmpeg' or download from ffmpeg.org"
    exit 1
}

# 2. Setup Files and Folders
$VideoName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
$OutputDir = Join-Path (Get-Location) "encrypted_$VideoName"
$KeyFile = Join-Path $OutputDir "stream.key"
$KeyInfoFile = Join-Path $OutputDir "enc.keyinfo"
$PlaylistFile = Join-Path $OutputDir "index.m3u8"
$SegmentPattern = Join-Path $OutputDir "segment_%03d.ts"
$KeyUrl = "stream.key" # The player will look for the key in the same folder

# Create output directory
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null
Write-Host "FOLDER Created output folder: $OutputDir" -ForegroundColor Cyan

# 3. Generate Encryption Key (16 bytes)
Write-Host "KEY Generating encryption key..." -ForegroundColor Cyan
$KeyBytes = New-Object Byte[] 16
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($KeyBytes)
[System.IO.File]::WriteAllBytes($KeyFile, $KeyBytes)

# 4. Create Key Info File for FFmpeg
# Format: <key URI> <key file path> <IV (optional)>
$KeyInfoContent = "$KeyUrl`n$KeyFile"
Set-Content -Path $KeyInfoFile -Value $KeyInfoContent -NoNewline

# 5. Run FFmpeg Encryption
Write-Host "Running FFmpeg (this takes time)..." -ForegroundColor Yellow
$FFmpegCommand = "ffmpeg -i `"$InputFile`" -c:v copy -c:a copy -hls_time 10 -hls_key_info_file `"$KeyInfoFile`" -hls_playlist_type vod -hls_segment_filename `"$SegmentPattern`" `"$PlaylistFile`""

# Execute
Invoke-Expression $FFmpegCommand

# 6. Cleanup
if (Test-Path $PlaylistFile) {
    Remove-Item $KeyInfoFile # Remove the temp info file, but KEEP the key file
    Write-Host "`nSUCCESS! Encrypted video is ready." -ForegroundColor Green
    Write-Host "-> Folder: $OutputDir"
    Write-Host "-> Upload this ENTIRE folder to your cPanel."
    Write-Host "-> URL will be: https://your-site.com/uploads/encrypted_$VideoName/index.m3u8"
}
else {
    Write-Host "`nERROR: FFmpeg failed to create the playlist." -ForegroundColor Red
}
