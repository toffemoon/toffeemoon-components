# Toffeemoon Components launcher: open browser if the dev server is already up, else start vite first.
# NOTE: keep this file ASCII-only - PowerShell 5.1 misreads UTF-8 without BOM.
$port = 5188
$root = $PSScriptRoot

$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

if (-not $listening) {
    $viteJs = Join-Path $root "node_modules\vite\bin\vite.js"

    # This library has a lot of dependencies (three / gsap / motion / remotion / tailwind).
    # A fresh clone has no node_modules, so install first - with a visible window,
    # otherwise it looks like nothing happened for a couple of minutes.
    if (-not (Test-Path $viteJs)) {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install" -WorkingDirectory $root -Wait
    }

    if (-not (Test-Path $viteJs)) {
        Start-Process ("https://github.com/toffemoon/toffeemoon-components")
        exit 1
    }

    Start-Process -FilePath "node" -ArgumentList ('"' + $viteJs + '" --port ' + $port + ' --strictPort') -WorkingDirectory $root -WindowStyle Hidden

    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Milliseconds 500
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { break }
    }
}

Start-Process ("http://localhost:" + $port)
