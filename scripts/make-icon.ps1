# 1024x1024 uygulama simgesi üretir (saydamlık yok): resources/icon.png
# Ocak ateşi önünde örs, üstünde altın külçe yığını ve kıvılcımlar; altta ana menüdeki gibi "INGOT EMPIRE" yazısı ve küçük "IDLE" etiketi.
# Yazı tipi oyunun kendi Pirata One'ı: node_modules'teki WOFF dosyası TTF'ye çevrilip kullanılır.
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot ".."
$S = 1024
$out = Join-Path $root "resources\icon.png"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null

# yazı tipi
$fontDir = Join-Path $PSScriptRoot ".fonts"
New-Item -ItemType Directory -Force $fontDir | Out-Null
$ttf = Join-Path $fontDir "PirataOne.ttf"
if (-not (Test-Path $ttf)) {
  node (Join-Path $PSScriptRoot "woff2ttf.mjs") (Join-Path $root "node_modules\@fontsource\pirata-one\files\pirata-one-latin-400-normal.woff") $ttf | Out-Null
}
$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile((Resolve-Path $ttf))
$pirata = $fonts.Families[0]

$bmp = New-Object System.Drawing.Bitmap $S, $S, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.InterpolationMode = 'HighQualityBicubic'
function P($x, $y) { New-Object System.Drawing.Point $x, $y }
function Brush($r, $gr, $b) { New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($r, $gr, $b)) }
function Col($r, $gr, $b) { [System.Drawing.Color]::FromArgb($r, $gr, $b) }

# arka plan: koyu ahşap, örsün arkasında ocak ışıltısı
$g.FillRectangle((Brush 43 29 20), 0, 0, $S, $S)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(252, 0, 520, 520)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
$glow.CenterColor = (Col 255 190 70)
$glow.SurroundColors = @((Col 43 29 20))
$g.FillPath($glow, $path)

# --- çizim (orijinal 1024'lük koordinatlarda), yukarı ve küçültülmüş olarak
$st = $g.Save()
$k = 0.47
$g.TranslateTransform(270, -18)
$g.ScaleTransform($k, $k)

$rnd = New-Object System.Random 4
for ($i = 0; $i -lt 40; $i++) {
  $x = 300 + $rnd.Next(420); $y = 140 + $rnd.Next(330); $r = 6 + $rnd.Next(12)
  $g.FillEllipse((Brush 255 (200 + $rnd.Next(55)) 90), $x, $y, $r, $r)
}

$outline = New-Object System.Drawing.Pen ((Col 30 18 10)), 22
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

# altın külçe yığını (3-2-1), kılıcın üstünde
function Ingot($x, $y) {
  $bw = 170; $tw = 118; $h = 62
  $body = @((P ($x - $bw / 2) $y), (P ($x + $bw / 2) $y), (P ($x + $tw / 2) ($y - $h)), (P ($x - $tw / 2) ($y - $h)))
  $g.FillPolygon((Brush 242 186 40), [System.Drawing.Point[]]$body)
  $g.FillPolygon((Brush 255 228 120), [System.Drawing.Point[]]@((P ($x - $tw / 2) ($y - $h)), (P ($x + $tw / 2) ($y - $h)), (P ($x + $tw / 2 + 8) ($y - $h + 18)), (P ($x - $tw / 2 - 8) ($y - $h + 18))))
  $g.DrawPolygon($outline, [System.Drawing.Point[]]$body)
}
Ingot 445 470; Ingot 600 470; Ingot 755 470
Ingot 522 404; Ingot 677 404
Ingot 600 338
$g.Restore($st)

# --- yazı: menüdeki gibi INGOT (altın) üstte, EMPIRE (krem, daha büyük) altta, en altta IDLE etiketi; kahverengi gölge ve koyu kontur
function TextPath($text, $size, $cx, $top, $maxW) {
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddString($text, $pirata, 0, $size, (New-Object System.Drawing.PointF 0, 0), $fmt)
  $b = $p.GetBounds()
  $sc = [Math]::Min(1, $maxW / $b.Width)
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.Translate($cx, $top)
  $m.Scale($sc, $sc)
  $m.Translate(-($b.X + $b.Width / 2), -$b.Y)
  $p.Transform($m)
  return $p
}
function DrawTitle($p, $fill) {
  $shadow = $p.Clone()
  $mm = New-Object System.Drawing.Drawing2D.Matrix
  $mm.Translate(0, 14)
  $shadow.Transform($mm)
  $g.FillPath((Brush 122 74 16), $shadow)
  $edge = New-Object System.Drawing.Pen ((Col 43 22 8)), 14
  $edge.LineJoin = 'Round'
  $g.DrawPath($edge, $p)
  $g.FillPath($fill, $p)
}
$top = TextPath 'INGOT' 170 512 448 470
$tb = $top.GetBounds()
$gold = New-Object System.Drawing.Drawing2D.LinearGradientBrush ((New-Object System.Drawing.PointF 0, $tb.Top)), ((New-Object System.Drawing.PointF 0, $tb.Bottom)), (Col 255 224 96), (Col 242 168 32)
DrawTitle $top $gold
$bottom = TextPath 'EMPIRE' 235 512 ($tb.Bottom + 12) 760
DrawTitle $bottom (Brush 255 243 207)

# IDLE etiketi: koyu, altın çerçeveli hap
$bb = $bottom.GetBounds()
$idle = TextPath 'IDLE' 92 512 ($bb.Bottom + 44) 400
$ib = $idle.GetBounds()
$pw = $ib.Width + 70; $ph = $ib.Height + 34
$px = 512 - $pw / 2; $py = $ib.Top - 17
$pill = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = $ph
$pill.AddArc($px, $py, $r, $r, 90, 180); $pill.AddArc($px + $pw - $r, $py, $r, $r, 270, 180); $pill.CloseFigure()
$g.FillPath((Brush 74 46 28), $pill)
$rim = New-Object System.Drawing.Pen ((Col 242 194 48)), 8
$g.DrawPath($rim, $pill)
$g.FillPath((Brush 255 214 80), $idle)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "Yazildi: $out"
