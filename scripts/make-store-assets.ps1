# Android ve Google Play görselleri: resources/icon.png'den üretilir.
#  resources/icon-foreground.png  1024x1024  Android uyarlanabilir simge ön yüzü (çizim güvenli alanda, %66)
#  resources/icon-background.png  1024x1024  uyarlanabilir simge arka yüzü (düz renk)
#  resources/splash.png           2732x2732  açılış ekranı
#  store/icon-512.png             512x512    Play Console uygulama simgesi
#  store/feature-graphic.png      1024x500   Play Console öne çıkan görsel
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot ".."
$res = Join-Path $root "resources"
$store = Join-Path $root "store"
New-Item -ItemType Directory -Force $store | Out-Null
$icon = [System.Drawing.Image]::FromFile((Resolve-Path (Join-Path $res "icon.png")))
$bg = [System.Drawing.Color]::FromArgb(43, 29, 20)

function NewCanvas($w, $h) {
  $b = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.TextRenderingHint = 'AntiAliasGridFit'
  return @($b, $g)
}
function Save($b, $g, $path) { $b.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose(); Write-Output "Yazildi: $path" }
# simge, kenarındaki ince çerçeve çizgisi kırpılarak çizilir (koyu zemine yumuşakça karışır)
$ia = New-Object System.Drawing.Imaging.ImageAttributes
$ia.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
function DrawIcon($g, $x, $y, $s) {
  $g.DrawImage($icon, (New-Object System.Drawing.Rectangle $x, $y, $s, $s), 6, 6, ($icon.Width - 12), ($icon.Height - 12), ([System.Drawing.GraphicsUnit]::Pixel), $ia)
}
function Glow($g, $x, $y, $w, $h, $alpha) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddEllipse($x, $y, $w, $h)
  $br = New-Object System.Drawing.Drawing2D.PathGradientBrush $p
  $br.CenterColor = [System.Drawing.Color]::FromArgb($alpha, 255, 190, 70)
  $br.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 43, 29, 20))
  $g.FillPath($br, $p)
}

# uyarlanabilir simge: ön yüz, simge %62 ölçekle ortada; yuvarlak maskede bile yazının köşeleri güvenli alanda kalır
$c = NewCanvas 1024 1024; $b = $c[0]; $g = $c[1]
$g.Clear($bg)
$s = [int](1024 * 0.62); $o = [int]((1024 - $s) / 2)
DrawIcon $g $o $o $s
Save $b $g (Join-Path $res "icon-foreground.png")

$c = NewCanvas 1024 1024; $b = $c[0]; $g = $c[1]
$g.Clear($bg)
Save $b $g (Join-Path $res "icon-background.png")

# açılış ekranı: koyu zemin, ortada simge
$c = NewCanvas 2732 2732; $b = $c[0]; $g = $c[1]
$g.Clear($bg)
DrawIcon $g 1066 1066 600
Save $b $g (Join-Path $res "splash.png")

# Play simgesi 512x512 (32 bit PNG, saydamlık yok)
$c = NewCanvas 512 512; $b = $c[0]; $g = $c[1]
$g.Clear($bg)
$g.DrawImage($icon, 0, 0, 512, 512)
Save $b $g (Join-Path $store "icon-512.png")

# öne çıkan görsel 1024x500: solda simge (adıyla), sağda Türkçe alt ad ve özellikler
$c = NewCanvas 1024 500; $b = $c[0]; $g = $c[1]
$g.Clear($bg)

Glow $g 520 60 600 380 70
DrawIcon $g 40 40 420
$family = 'Impact'
$gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 210, 90))
$cream = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 243, 207))
$shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(160, 20, 10, 5))
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = 'Center'
$f1 = New-Object System.Drawing.Font $family, 64, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$f2 = New-Object System.Drawing.Font $family, 108, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$f3 = New-Object System.Drawing.Font 'Segoe UI', 30, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$cx = 745
# simgede "FORGE MASTER" zaten yazıyor; sağda Türkçe alt ad ve kısa özellikler
# Windows PowerShell 5.1 dosyayı ANSI okur; Türkçe harfler kodla yazılır
$l1 = "DEM$([char]0x130)RC$([char]0x130)"                                   # DEMİRCİ
$l2 = "KRALLI$([char]0x11E)I"                                                # KRALLIĞI
$tag = "D$([char]0xF6)v, sat, krall$([char]0x131)$([char]0x11F)$([char]0x131) kur!"   # Döv, sat, krallığı kur!
$feat = "6 b$([char]0xF6)lge $([char]0xB7) Haftal$([char]0x131)k d$([char]0xFC)$([char]0x15F)man $([char]0xB7) S$([char]0x131)ralama"  # 6 bölge · Haftalık düşman · Sıralama
$f4 = New-Object System.Drawing.Font 'Segoe UI', 22, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(233, 215, 176))
$g.DrawString($l1, $f1, $shadow, (New-Object System.Drawing.RectangleF ($cx - 300 + 4), 84, 600, 90), $fmt)
$g.DrawString($l1, $f1, $gold, (New-Object System.Drawing.RectangleF ($cx - 300), 80, 600, 90), $fmt)
$g.DrawString($l2, $f2, $shadow, (New-Object System.Drawing.RectangleF ($cx - 300 + 5), 145, 600, 140), $fmt)
$g.DrawString($l2, $f2, $cream, (New-Object System.Drawing.RectangleF ($cx - 300), 140, 600, 140), $fmt)
$g.DrawString($tag, $f3, $gold, (New-Object System.Drawing.RectangleF ($cx - 300), 300, 600, 50), $fmt)
$g.DrawString($feat, $f4, $muted, (New-Object System.Drawing.RectangleF ($cx - 300), 352, 600, 40), $fmt)
Save $b $g (Join-Path $store "feature-graphic.png")

$icon.Dispose()
