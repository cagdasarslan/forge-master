# Forge Master Idle

Orta Çağ temalı 3D arcade-idle mobil oyun. Altı farklı bölgede atölye kurup Kral'ın siparişlerini yetiştirirsin. Bölgelerin malları Krallık Ambarı'nda birleşir ve her hafta krallığa saldıran yeni bir düşmanı yenecek silahı dövmeye gider. Oyun bitmez: her 7 günde yeni bir düşman gelir.

Three.js + Vite ile yazıldı; iOS uygulaması Capacitor ile paketlenir. Modeller, simgeler, dokular ve sesler kodla üretilir; harici asset yok.

## Çalıştırma

```bash
npm install
npm run dev
```

Telefonla aynı Wi-Fi'deysen terminalde görünen `Network:` adresini telefonda aç. Masaüstünde WASD / ok tuşları, telefonda ekranın herhangi bir yerinden sürükleme ile hareket edilir.

## Krallık

| # | Bölge | Görünüm | Üretim | Özel mekanik | Ambar'a | Kervanla gelir |
|---|---|---|---|---|---|---|
| 1 | Demirci Köyü | Çayır, evler, yel değirmeni | Külçe → kılıç, kalkan | Öğretici | Demir Külçe | |
| 2 | Bakır Vadisi | Kızıl toprak, tepeler, kayalıklar | Bakır + kalay → bronz (kubbe fırın) → mızrak (torna), miğfer (döküm) | Kalay nehrin karşısında, önce köprü | Bronz | Demir külçe |
| 3 | Kömür Kalesi | Kaldırım taşı, surlar, kale | Demir → çelik (yüksek fırın) → zırh, çelik kılıç (su çekici) | Fırın kömürle ısındığı sürece çalışır | Çelik | Bronz |
| 4 | Altın Nehri | Kum, rıhtım, kayıklar, su çarkı | Kum → altın (eleme oluğu) → varak (pota), taç (kuyumcu) | Elemede altın %65 şansla çıkar | Altın Varak | Çelik |
| 5 | Kristal Mağaraları | Karanlık taş, mantarlar, kristaller | Damar + mana → kristal (öğütücü) → asa (büyü sunağı) | Karanlık, oyuncunun elinde fener; derin damar meşaleyle açılır | Ruh Kristali | Altın varak |
| 6 | Ejderha Dağı | Kül ve lav çatlakları, volkanlar | Lav + pul → ejderha ateşi (obsidyen ocak), pul kalkan (pres) | Ejderha uyurken pul toplanır; uyanınca indeki yük yanar | Ejderha Ateşi | Çelik |

- **Kraliyet Siparişi** (sandık): sonsuz seviyeli. Her sipariş mühür ve altın verir. Bir bölgede 3. sipariş bitince sıradaki bölge açılır.
- **KERVAN** alanı (sandığın önü): oraya bırakılan bölge malı doğrudan **Krallık Ambarı**'na gider. Siparişi bitmiş bölgeler ayrıca kendi kendine yavaş bir kervan akışı yollar.
- **Kervan durağı (GELEN)**: bazı tarifler başka bölgenin malına ihtiyaç duyar; mal Ambar'dan gelir. Ambar boşsa durak, hangi bölgeye dönmen gerektiğini söyler.
- **Haftalık sefer** (başkent): her 7 günde yeni düşman: Kızıl Ejderha, Buz Devi, Krakeni, Kara Lich, Taş Golem, Ork Savaş Lordu, Gölge Kraliçe, Kurt Kral, sonra baştan ve daha güçlü. Silahın parçalarını Ambar'dan gönderirsin. Yenilen her düşman ganimet salonuna girer (satışlar kalıcı +%3), haftanın kalanında **Kraliyet Görevleri** mühür verir. Yenilemeyen düşman kaçar, ilerlemeye göre teselli mührü verilir.
- **Mühürler**: kalıcı bonuslar (başlangıç altını, bedava ilk işçi, hız, satış, atölye hızı, kervan akışı).

## Ana menü, mağaza ve reklamlar

- **Ana menü** açılışta görünür; oyundaki ev düğmesiyle dönülür. Bölge ve haftanın seferi özeti, Harita, Mağaza, Ücretsiz ödül ve Ses düğmeleri var.
- **Mağaza:**
  - Elmas: gerçek parayla alınan paketler.
  - Dükkan: elmasla bölgeye altın (siparişin değerine göre), 30 dk / 2 saat bereket, mühür.
  - Ücretsiz: reklam izle.
- **Ödüllü reklam** (günde 12): 5 dakika 2× bereket ya da bölgeye altın. Bereketteyken toplanan her kaynak iki tane gelir ve atölyeler iki kat hızlı çalışır. Süreler üst üste eklenir. Sol alttaki düğmelerden de izlenir.
- **Reklam bandı** her ekranın altında sabit durur (50 px, AdMob banner boyutu).

[src/monetization.js](src/monetization.js) şu an **test modunda**: satın almalar ve reklamlar simüle edilir. Gerçek ödeme için App Store Connect'te ürünler tanımlanıp StoreKit eklentisi (RevenueCat ya da cordova-plugin-purchase), gerçek reklam için AdMob ve `@capacitor-community/admob` bağlanmalı. İkisi de ücretli Apple Developer Program üyeliği ve App Store / TestFlight dağıtımı ister; ücretsiz Apple ID ile sideload edilen IPA'da gerçek satın alma çalışmaz.

## Süre (bot simülasyonuyla ölçüldü)

Oyunu kendi kendine oynayan bot (`src/sim.js`) ile ölçülen oyun süreleri. Bot hiç boş durmaz ve hep doğru şeyi seçer; gerçek oyuncu daha uzun sürer.

| | Süre |
|---|---|
| 1. hafta: 6 bölgenin açılması | 10,2 saat (Köy 72, Vadi 81, Kale 93, Nehir 66, Mağara 210 dk) |
| 1. hafta: Ejderha Kıran Kılıcı'nın kalanı | 3,4 saat |
| **1. hafta toplam** | **13,6 saat** |
| 2. hafta (Buz Devi), olgun krallıkla | 6,6 saat ölçüldü; ardından ihtiyaçlar ×1,7 yapıldı → ~11-12 saat bekleniyor |

Sonraki her hafta düşman %10 güçlenir.

## Geliştirme

Ortak değerler [src/config.js](src/config.js), düşmanlar [src/bosses.js](src/bosses.js), bölgeye özel tarif/sipariş/yerleşim `src/regions/*.js` içinde. Tarayıcı konsolunda:

```js
game.gold += 1000          // altın ekle
profile.addAmbar('steel', 500)
profile.data.seals += 5    // mühür ekle
stepGame(30)               // zamanı 30 sn ileri sar
await sim.run(1)           // botla 1 saat oyna, rapor al
await sim.until(3)         // bu bölgede 3. siparişe kadar oyna (dk döndürür)
window.camOverride = 60    // kamerayı uzaklaştır (0 = normal)
profile.reset()            // bütün kaydı sil
```

## Dosyalar

- `src/game.js`: bir bölgenin oyun mantığı (kaynaklar, atölyeler, tezgahlar, sandık, kervan, kervan durağı, inşa alanları, işçiler, müşteriler, siparişler, öğretici)
- `src/machines.js`: bölgelere özgü makineler, sancak, tabela, kervan arabası
- `src/scenery.js`: bölge zemin dokuları ve arka planları
- `src/regions/`: bölge verileri; `src/bosses.js`: haftalık düşmanlar
- `src/profile.js`: kayıt, Krallık Ambarı, mühürler, haftalık sefer, pasif ve çevrimdışı kervan akışı
- `src/ui.js`, `src/map.css`: HUD, Lonca paneli, krallık haritası, sefer ekranı, zafer sahnesi
- `src/sim.js`: denge botu (sadece geliştirme)

## iOS (IPA)

`main` dalına push edildiğinde `.github/workflows/ios.yml` GitHub'ın macOS sunucusunda imzasız `ForgeMaster.ipa` üretir (Actions → Artifacts). Telefona Windows'ta Sideloadly ve ücretsiz Apple ID ile kurulur.
