# 1024x1024 iOS uygulama simgesi üretir (saydamlık yok): resources/icon.png
# Ocak ateşi önünde örs, üstünde çekiç ve kıvılcımlar.
Add-Type -AssemblyName System.Drawing
$S = 1024
$out = Join-Path $PSScriptRoot "..\resources\icon.png"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null

$bmp = New-Object System.Drawing.Bitmap $S, $S, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
function P($x, $y) { New-Object System.Drawing.Point $x, $y }
function Brush($r, $gr, $b) { New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($r, $gr, $b)) }

# arka plan: koyu ahşap, ortada ocak ışıltısı
$g.FillRectangle((Brush 43 29 20), 0, 0, $S, $S)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(112, 80, 800, 800)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
$glow.CenterColor = [System.Drawing.Color]::FromArgb(255, 190, 70)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(43, 29, 20))
$g.FillPath($glow, $path)

# kıvılcımlar
$rnd = New-Object System.Random 4
for ($i = 0; $i -lt 40; $i++) {
  $x = 300 + $rnd.Next(420); $y = 140 + $rnd.Next(330); $r = 6 + $rnd.Next(12)
  $g.FillEllipse((Brush 255 (200 + $rnd.Next(55)) 90), $x, $y, $r, $r)
}

$outline = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(30, 18, 10)), 22
$outline.LineJoin = 'Round'

# kütük
$stump = @((P 380 760), (P 644 760), (P 680 940), (P 344 940))
$g.FillPolygon((Brush 143 90 44), [System.Drawing.Point[]]$stump)
$g.DrawPolygon($outline, [System.Drawing.Point[]]$stump)

# örs
$anvil = @((P 150 520), (P 300 500), (P 830 500), (P 880 560), (P 700 600), (P 640 640), (P 680 770), (P 340 770), (P 390 640), (P 330 600), (P 210 590))
$g.FillPolygon((Brush 120 132 146), [System.Drawing.Point[]]$anvil)
$g.FillPolygon((Brush 176 188 200), [System.Drawing.Point[]]@((P 300 500), (P 830 500), (P 860 535), (P 290 535)))
$g.DrawPolygon($outline, [System.Drawing.Point[]]$anvil)

# kızgın kılıç örsün üstünde
$g.FillPolygon((Brush 255 140 40), [System.Drawing.Point[]]@((P 330 470), (P 760 470), (P 810 488), (P 760 506), (P 330 506)))
$g.FillRectangle((Brush 242 194 48), 290, 440, 44, 96)
$g.DrawPolygon($outline, [System.Drawing.Point[]]@((P 330 470), (P 760 470), (P 810 488), (P 760 506), (P 330 506)))

# çekiç (çapraz)
$st = $g.Save()
$g.TranslateTransform(640, 300)
$g.RotateTransform(-35)
$g.FillRectangle((Brush 138 85 48), -24, -40, 48, 330)
$g.DrawRectangle($outline, -24, -40, 48, 330)
$g.FillRectangle((Brush 154 164 174), -120, -120, 240, 110)
$g.FillRectangle((Brush 200 208 216), -120, -120, 240, 30)
$g.DrawRectangle($outline, -120, -120, 240, 110)
$g.Restore($st)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "Yazildi: $out"
