# Forge Master: Krallık Tasarımı

Altı bölge tek bir krallığın parçaları. Her bölgenin kendine özgü arazisi, makineleri ve mekaniği var. Bölgeler birbirine kervanlarla bağlı, hepsinin ürünü başkentte birleşir. Oyun bitmez: her hafta krallığa yeni bir düşman saldırır.

## Döngü
1. Bölgede kaynak topla, atölyede işle, müşterilere sat (altın), Kral'ın siparişini sandığa teslim et (mühür + altın).
2. Bölgenin malını **KERVAN** alanına bırak → Krallık Ambarı. Siparişi bitmiş bölgeler yavaş bir kervan akışı da yollar (oyun kapalıyken en fazla 8 saat, yarı verimle).
3. Başkentte haftanın silahını Ambar'dan parça parça doldur → sefere çık → düşmanı yen.
4. Mühürlerle bütün krallığa kalıcı bonus al.

## Bölgeleri birbirine bağlayanlar
- **Krallık Ambarı:** bütün bölgelerin malı burada birleşir.
- **Kervan durakları:** Vadi'nin miğferi Köy'ün demirini, Kale'nin çelik kılıcı Vadi'nin bronzunu, Nehir'in tacı Kale'nin çeliğini, Mağara'nın asası Nehir'in varağını, Ejderha Dağı'nın kalkanı Kale'nin çeliğini ister. Ambar boşsa durak, hangi bölgeye dönmen gerektiğini söyler.
- **Görünür bağlar:** her bölgede aynı kraliyet sancakları, başkente yol tabelası, yoldan geçen kervan arabaları. Harita tek kara parçası, bölgeler kendi renginde topraklar; Ambar'a mal yollayan bölgelerden başkente kervan yolları akar.

## Bölgeler

| Bölge | Arazi | Makineler | Mekanik |
|---|---|---|---|
| Demirci Köyü | Çayır, evler, yel değirmeni, tarlalar | Dökümhane, örs, kalkan tezgahı | Öğretici |
| Bakır Vadisi | Kızıl toprak, tepeler, bakır kayalıklar | Kubbe bronz ocağı, mızrak tornası, miğfer döküm tezgahı | Köprü kurulmadan kalay alınamaz; tüccar ham bakır da alır |
| Kömür Kalesi | Kaldırım taşı, surlar, kuleler, kale | Yüksek fırın kulesi, zırhhane, su çekici | Fırın kömür yakarak ısınır, kömür bitince durur |
| Altın Nehri | Kum, rıhtımlar, kayıklar, sazlık, su çarkı | Eleme oluğu, pota ocağı, kuyumcu | Eleme %65 şansla altın verir |
| Kristal Mağaraları | Karanlık taş, mağara duvarları, ışıklı mantarlar | Kristal öğütücü, büyü sunağı | Karanlık, elde fener; derin damar meşaleyle açılır |
| Ejderha Dağı | Kül, lav çatlakları, volkanlar, ölü ağaçlar | Obsidyen ocak, pul presi | Ejderha uyurken pul toplanır; uyanınca inde kalanın yükü yanar |

## Sonsuz ilerleme
- **Siparişler:** her bölgede ilk üçü elle ayarlı, sonrakiler %30 büyüyerek sonsuza dek sürer. 3. sipariş sıradaki bölgeyi açar.
- **Haftalık sefer:** 7 günde bir yeni düşman (8 düşman döner, her turda güçlenir): Kızıl Ejderha → Buz Devi → Derinlerin Krakeni → Kara Lich → Taş Golem → Ork Savaş Lordu → Gölge Kraliçe → Kurt Kral → Kızıl Ejderha (daha güçlü) …
- **Zafer:** mühür, ganimet salonuna hatıra (satışlar kalıcı +%3), haftanın kalanında sonsuz Kraliyet Görevleri.
- **Kaybetme:** düşman kaçar, ilerlemeye göre teselli mührü; Ambar'daki mal korunur.

## Süre hedefi
Bir haftalık hedef en az 12-13 saat oyun. Bot simülasyonu (`src/sim.js`) ile ölçüldü: 1. hafta 13,6 saat. 2. hafta ihtiyaçları olgun bölgelerin ölçülen üretim hızına (saatte ~1100-1250 mal) göre ~11-12 saate ayarlandı. Ayrıntılar README'de.
