Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\user\.gemini\antigravity\brain\d3a19cf9-d0c1-418f-8f3f-571603c51813\.user_uploaded\media_1792727301972_40381765.png'
$bmp = New-Object System.Drawing.Bitmap($imgPath)
Write-Host "Image size: $($bmp.Width) x $($bmp.Height)"

function Get-Hex($x, $y) {
    if ($x -ge $bmp.Width -or $y -ge $bmp.Height -or $x -lt 0 -or $y -lt 0) { return "OUT_OF_BOUNDS" }
    $c = $bmp.GetPixel([int]$x, [int]$y)
    return "#{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B
}

Write-Host "Top Menu (50, 20): $(Get-Hex 50 20)"
Write-Host "Command bar (50, 42): $(Get-Hex 50 42)"
Write-Host "Left toolbar (10, 100): $(Get-Hex 10 100)"
Write-Host "Left subtool item (70, 95): $(Get-Hex 70 95)"
Write-Host "Left subtool active (70, 160): $(Get-Hex 70 160)"
Write-Host "Color circle panel (70, 360): $(Get-Hex 70 360)"
Write-Host "Color set panel (70, 480): $(Get-Hex 70 480)"
Write-Host "Canvas frame background (300, 300): $(Get-Hex 300 300)"
Write-Host "Right navigator header (900, 52): $(Get-Hex 900 52)"
Write-Host "Right history active item (880, 195): $(Get-Hex 880 195)"
Write-Host "Bottom status bar (200, 538): $(Get-Hex 200 538)"

$bmp.Dispose()
