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

- **Kraliyet Siparişi** (sandık): sonsuz seviyeli. Her sipariş mühür ve altın verir.
- **Bölge bekçisi:** 3. sipariş bitince sıradaki bölgeye giden yolu bölgenin madenine göre bir bekçi tutar: Demir Golem (Köy), Bakır Basilisk (Vadi), Kömür Devi (Kale), Altın Timsah (Nehir), Kristal Örümcek Kraliçesi (Mağara), Magma Titanı (Ejderha Dağı). Bekçi, bölgenin bir köşesindeki arenada zincirlere bağlı durur ve can barı vardır (Köy 20 bin, Ejderha Dağı 160 bin can). Lonca → **Ordu** sekmesinden ya da arenanın önündeki ORDU alanından asker türleri altınla açılır ve **seviye** atlatılır; her seviye vuruşu artırır (fiyat her seviyede %12 artar). Açılan her tür arenada bir asker olarak belirir, her 10 seviyede bir asker daha katılır (en fazla 3). Saldırıda askerler arenaya yürür ve 30 saniye boyunca vurur; can bitmezse canavar iyileşir. Günde en fazla 3 saldırı.
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

[src/monetization.js](src/monetization.js): **Android'de** gerçek AdMob (banner + ödüllü, AB için Google rıza formu) ve Google Play Faturalandırma (`cordova-plugin-purchase`, tüketilebilir `gems_*` ürünleri) kullanılır. Reklam kimlikleri şimdilik Google'ın test kimlikleri. Tarayıcıda ve iOS'ta **test modu**: satın almalar ve reklamlar simüle edilir (iOS'ta gerçek ödeme ücretli Apple Developer Program ve App Store / TestFlight ister).

## Süre (bot simülasyonuyla ölçüldü)

Oyunu kendi kendine oynayan bot (`src/sim.js`) ile ölçülen oyun süreleri. Bot hiç boş durmaz ve hep doğru şeyi seçer; gerçek oyuncu daha uzun sürer.

| | Süre |
|---|---|
| 1. hafta: 6 bölgenin siparişleri | 9,2 saat (Köy 72, Vadi 72, Kale 84, Nehir 69, Mağara 201, Ejderha 54 dk) |
| 1. hafta: 6 bölge bekçisi | 8,7 saat (Köy 72, Vadi 90, Kale 99, Nehir 57, Mağara 132, Ejderha 69 dk) |
| 1. hafta: Ejderha Kıran Kılıcı'nın kalanı | ~3,4 saat (bekçilerden önceki ölçüm) |
| **1. hafta toplam** | **~21 saat** |
| 2. hafta (Buz Devi), olgun krallıkla | 6,6 saat ölçüldü; ardından ihtiyaçlar ×1,7 yapıldı → ~11-12 saat bekleniyor |

Sonraki her hafta düşman %10 güçlenir.

## Geliştirme

Ortak değerler [src/config.js](src/config.js), düşmanlar [src/bosses.js](src/bosses.js), bölgeye özel tarif/sipariş/yerleşim `src/regions/*.js` içinde. `npm run dev` ile açılan tarayıcı konsolunda (yayın paketinde bu kancalar yoktur):

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

## Android (Google Play)

```bash
npm run android:apk   # debug APK (emülatör / telefon)
npm run android:aab   # imzalı yayın paketi (android/keystore.properties gerekir)
```

Yayınlama adımları, mağaza metinleri ve Play Console form yanıtları: [PLAY_STORE.md](PLAY_STORE.md). Simge, açılış ekranı ve mağaza görselleri `scripts/make-store-assets.ps1` ile `resources/icon.png`'den üretilir, ardından `npx capacitor-assets generate --android`.
