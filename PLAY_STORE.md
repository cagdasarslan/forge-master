# Google Play'de yayınlama

Forge Master'ın Android sürümü hazır: AdMob (banner + ödüllü reklam), Google Play Faturalandırma (elmas paketleri), Android geri tuşu, uyarlanabilir simge ve açılış ekranı, hedef API 36. Aşağıdaki adımların bir kısmı yalnız senin hesabınla yapılabilir (anahtar, AdMob, Play Console).

Sıra: **1** anahtar → **2** AdMob → **3** Play Console'da uygulama → **4** ilk AAB'yi dahili teste yükle → **5** uygulama içi ürünler → **6** mağaza kaydı ve formlar → **7** kapalı test (12 kişi, 14 gün) → **8** üretime başvuru.

---

## 1. Yükleme anahtarı (bir kez)

Anahtarı depo klasörünün **dışında** sakla ve yedekle (kaybolursa Play destek ile sıfırlamak gerekir). Şifreyi sen belirlersin; kimseyle paylaşma.

```bash
mkdir C:\npm\forge-master-keys
```

```bash
keytool -genkeypair -v -keystore C:\npm\forge-master-keys\forgemaster-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Sonra `android/keystore.properties` dosyasını oluştur (git bu dosyayı yok sayar):

```properties
storeFile=C:/npm/forge-master-keys/forgemaster-upload.jks
storePassword=BELİRLEDİĞİN_ŞİFRE
keyAlias=upload
keyPassword=BELİRLEDİĞİN_ŞİFRE
```

Play Console'da **Play Uygulama İmzalama** açık kalsın (varsayılan): Google asıl imza anahtarını saklar, sen bu yükleme anahtarıyla imzalarsın.

## 2. AdMob

1. [admob.google.com](https://admob.google.com) → Uygulamalar → **Uygulama ekle** → Android → "Uygulama henüz yayınlanmadı" → ad: Forge Master.
2. İki reklam birimi oluştur: **Banner** ve **Ödüllü** (ödül: 1 adet, ad önemli değil; oyun kendi ödülünü verir).
3. Kimlikleri koy:
   - Uygulama kimliği (`ca-app-pub-XXXX~YYYY`) → [android/app/src/main/res/values/strings.xml](android/app/src/main/res/values/strings.xml) içindeki `admob_app_id`
   - Banner ve ödüllü birim kimlikleri (`ca-app-pub-XXXX/ZZZZ`) → [src/monetization.js](src/monetization.js) içindeki `AD_UNITS`
4. AdMob → Gizlilik ve mesajlaşma → **GDPR** mesajını oluştur ve yayınla (Avrupa'daki oyunculara rıza formu bundan gelir; oyun formu kendisi gösterir).
5. Uygulama yayınlanınca AdMob'da uygulamayı Play kaydına bağla. `app-ads.txt` için bir geliştirici web sitesi gerekir (Play kaydındaki web sitesi alanı). GitHub Pages adresi kullanılabilir.

Gerçek kimliklerle kendi telefonunda test ederken **kendi reklamlarına tıklama** (hesap askıya alınabilir). AdMob → Ayarlar → Test cihazları'na telefonunu ekle.

## 3. Gizlilik politikası

[docs/privacy.html](docs/privacy.html) hazır (iletişim: leronsoftware@gmail.com). Yayın için GitHub'da depo → Settings → Pages → Branch: `main`, klasör: `/docs` → Save. Adres şöyle olur:

`https://<kullanıcı-adın>.github.io/forge-master/privacy.html`

## 4. Derleme

```bash
npm run android:aab
```

Çıktı: `android/app/build/outputs/bundle/release/app-release.aab`. Her yeni yüklemede [android/app/build.gradle](android/app/build.gradle) içindeki `versionCode` bir artırılır (1, 2, 3…), `versionName` istersen değişir (1.0.1…).

Emülatörde/telefonda denemek için debug APK: `npm run android:apk` → `android/app/build/outputs/apk/debug/app-debug.apk`.

## 5. Play Console

1. **Uygulama oluştur:** ad *Forge Master*, varsayılan dil Türkçe, Oyun, Ücretsiz.
2. **Test → Dahili test** → yeni sürüm → AAB'yi yükle. (Uygulama içi ürünler ancak bir AAB yüklendikten sonra oluşturulabilir.)
3. **Para kazanma → Ürünler → Uygulama içi ürünler** (önce ödeme profilini tamamla). Dört ürün, kimlikler birebir aynı olmalı:

| Ürün kimliği | Ad | Fiyat (öneri) |
|---|---|---|
| `gems_s` | 100 Elmas | ₺29,99 |
| `gems_m` | 550 Elmas | ₺129,99 |
| `gems_l` | 1.440 Elmas | ₺279,99 |
| `gems_xl` | 4.050 Elmas | ₺599,99 |

Hepsini **Etkin** yap. Oyun fiyatı Play'den okur ve oyuncunun ülkesindeki fiyatı gösterir.

4. **Lisans testi:** Ayarlar → Lisans testi → kendi Gmail adresini ekle. Böylece dahili testte satın almalar gerçek para çekmez ("Test kartı, her zaman onaylanır").

## 6. Mağaza kaydı ve formlar

Görseller hazır: [store/](store/)
- Uygulama simgesi: `store/icon-512.png`
- Öne çıkan görsel: `store/feature-graphic.png` (1024×500)
- Telefon ekran görüntüleri: `store/screenshots/*.png` (1080×2160)

**Kısa açıklama (TR, en fazla 80):**
Demirhaneni kur, kılıç döv, bekçileri yen, altı bölgeden bir krallık kur!

**Tam açıklama (TR):**
```
Forge Master'da küçük bir köy demircisi olarak başlar, altı bölgeden oluşan bir krallığın demircisi olursun.

⚒ TOPLA, ERİT, DÖV, SAT
Odun ve maden topla, ocakta külçe erit, örste kılıç ve kalkan döv. Müşterilerin tezgahından altını topla, işçi tut, atölyeni büyüt.

🗺 ALTI FARKLI BÖLGE
Demirci Köyü, Bakır Vadisi, Kömür Kalesi, Altın Nehri, Kristal Mağaraları ve Ejderha Dağı. Her bölgenin kendi madeni, makineleri ve görünümü var. Bölgelerin malları kervanlarla Krallık Ambarı'nda birleşir.

⚔ BÖLGE BEKÇİLERİ
Her bölgenin yolunu zincirlere bağlı bir canavar tutar: Demir Golem, Bakır Basilisk, Kömür Devi, Altın Timsah, Kristal Örümcek Kraliçesi ve Magma Titanı. Askerlerini topla, seviyelerini yükselt ve arenada saldır!

🐉 HER HAFTA YENİ DÜŞMAN
Kızıl Ejderha, Buz Devi, Derinlerin Krakeni, Kara Lich… Her hafta krallığa yeni bir düşman saldırır. Bütün bölgelerin malıyla onu yenecek silahı dök. Oyun bitmez.

👑 KALICI İLERLEME
Kral'ın siparişlerinden mühür kazan, kalıcı bonuslar aç. Oyunda değilken de kervanların çalışmaya devam eder.

Oyun ücretsizdir; reklam ve isteğe bağlı uygulama içi satın alma içerir.
```

**Short description (EN):** Build your forge, craft swords, beat the guardians and unite six regions!

**Full description (EN):**
```
Start as a village blacksmith and become the master smith of a six-region kingdom.

⚒ GATHER, SMELT, FORGE, SELL
Gather wood and ore, smelt ingots, forge swords and shields on the anvil. Collect gold from your stalls, hire workers and grow your workshop.

🗺 SIX UNIQUE REGIONS
Blacksmith Village, Copper Valley, Coal Castle, Gold River, Crystal Caves and Dragon Mountain, each with its own ore, machines and look. Caravans carry every region's goods to the Royal Storehouse.

⚔ REGION GUARDIANS
A chained monster blocks the road out of every region. Recruit soldiers, level them up and attack in the arena!

🐉 A NEW ENEMY EVERY WEEK
Red Dragon, Frost Giant, Kraken, Lich… Every week a new enemy attacks the kingdom. Forge the weapon to defeat it with goods from all regions. The game never ends.

👑 PERMANENT PROGRESS
Earn royal seals from the King's orders and unlock permanent bonuses. Caravans keep working while you're away.

Free to play; contains ads and optional in-app purchases.
```

(Oyun şu an yalnız Türkçe. İngilizce kaydı eklersen açıklamaya "Game language: Turkish" yazmak iyi olur, yoksa yalnız Türkçe kayıt yeterli.)

**Uygulama içeriği (Policy → App content) yanıtları:**

| Form | Yanıt |
|---|---|
| Gizlilik politikası | GitHub Pages adresi (3. adım) |
| Uygulama erişimi | Tüm işlevler kısıtlama olmadan kullanılabilir |
| Reklamlar | Evet, reklam içeriyor |
| İçerik derecelendirmesi | Anket: Oyun; şiddet: "fantastik/çizgi film karakterlerine karşı hafif şiddet" (canavarlarla dövüş, kan yok); kumar/sohbet/kullanıcı içeriği yok; dijital ürün satın alma var. Beklenen sonuç: PEGI 7 / IARC 7+ |
| Hedef kitle | 13–15, 16–17, 18+ (13 yaş altını seçme; seçersen Aileler politikası ve sertifikalı reklam ağı kuralları gelir) |
| Reklam kimliği | Evet, kullanıyor → Reklam ve pazarlama |
| Haber uygulaması / COVID / devlet | Hayır |
| Finansal özellikler, sağlık | Yok |

**Veri güvenliği (Data safety):**
- Veri topluyor ya da paylaşıyor mu: **Evet** (AdMob SDK nedeniyle)
- Aktarımda şifreleniyor: **Evet**
- Kullanıcı veri silme isteyebilir mi: hesap yok; veriler cihazda. "Hesap oluşturulmuyor" seçeneğini işaretle.
- Toplanan veri türleri (hepsi **paylaşılıyor: Evet**, **zorunlu**, amaç: **Reklam veya pazarlama, Analiz, Dolandırıcılığı önleme/güvenlik**):
  - Konum → Yaklaşık konum
  - Uygulama etkinliği → Uygulama etkileşimleri
  - Uygulama bilgileri ve performans → Kilitlenme günlükleri, Teşhis
  - Cihaz veya diğer kimlikler → Cihaz veya diğer kimlikler
- Satın alma geçmişi: ödeme Google Play'de işlenir, oyun sunucuya bir şey göndermez; beyan etmen gerekmez.

## 7. Kapalı test (yeni kişisel hesap: zorunlu)

2023 sonrası açılmış kişisel hesaplarda üretime çıkmadan önce **en az 12 test kullanıcısının 14 gün boyunca kesintisiz** kapalı teste katılmış olması gerekir.

1. Test → **Kapalı test** → yeni kanal (ör. "alpha") → aynı AAB'yi (ya da yenisini) yükle.
2. Testçiler: e-posta listesi oluştur, en az 12 (tercihen 15+, biri çıkarsa sayı düşmesin) Gmail adresi ekle.
3. Katılım bağlantısını paylaş; herkes bağlantıdan "Test kullanıcısı ol" deyip uygulamayı Play'den kursun ve 14 gün boyunca testte kalsın (arada açıp oynamaları iyi olur).
4. Bu sürede gelen geri bildirimlere göre güncelleme yükle (versionCode artır).

## 8. Üretime başvuru

14 gün dolunca Kontrol paneli → **Üretim erişimi için başvur** → test sürecini anlatan kısa formu doldur (kaç kişi test etti, ne düzeltildi). Onay genelde birkaç gün sürer. Sonra Üretim → yeni sürüm → AAB → ülkeler → incelemeye gönder.

## Yayından önce kontrol listesi

- [x] `admob_app_id` ve `AD_UNITS` gerçek kimliklerle değişti (test kimlikleri kalırsa reklamlar "Test Ad" olur ve gelir getirmez)
- [x] `docs/privacy.html` yayında: https://cagdasarslan.github.io/forge-master/privacy.html
- [ ] `versionCode` bir öncekinden büyük
- [ ] `android/keystore.properties` var, `npm run android:aab` imzalı AAB üretti
- [ ] Dahili testte: banner görünüyor, ödüllü reklam ödülü veriyor, test kartıyla elmas paketi alınıyor ve elmas ekleniyor, geri tuşu pencereleri kapatıyor
