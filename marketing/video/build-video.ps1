# Builds the tutorial video for the co-interns (voice-over + lo-fi bed + motion graphics).
#   powershell -ExecutionPolicy Bypass -File marketing\video\build-video.ps1          full video
#   powershell -ExecutionPolicy Bypass -File marketing\video\build-video.ps1 -Stills  key frames only
# Needs: Python 3 with Pillow + numpy + edge-tts (pip install --user edge-tts), ffmpeg (scoop install ffmpeg).
# Edit captions / voice lines in scenes.json (UTF-8). Screenshots: shots\01.png..13.png. QR: apk-qr.png
# (make-qr.js). Output: out\ojt-budget-tutorial.mp4
param([switch]$Stills)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { $env:Path += ";$env:USERPROFILE\scoop\shims" }
python (Join-Path $PSScriptRoot 'make_voice.py'); if ($LASTEXITCODE -ne 0) { throw 'voice-over failed' }
if ($Stills) { python (Join-Path $PSScriptRoot 'render_video.py') --stills }
else { python (Join-Path $PSScriptRoot 'render_video.py') }
if ($LASTEXITCODE -ne 0) { throw 'render failed' }
