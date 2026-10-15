// Mağaza (elmas paketleri), ödüllü reklamlar ve alt reklam bandı.
//
// ŞU AN TEST MODUNDA: satın almalar ve reklamlar SİMÜLE edilir. Gerçek ödeme alınmaz, gerçek reklam gösterilmez.
// Gerçek sürüm için:
//  - Satın alma: App Store Connect → Uygulama İçi Satın Alma'da her paket için ürün kimliği (GEM_PACKS[].id) tanımlanır,
//    StoreKit eklentisi (ör. RevenueCat ya da cordova-plugin-purchase) ile `buyPack` değiştirilir.
//    Ücretli Apple Developer Program üyeliği gerekir; ücretsiz Apple ID ile sideload edilen uygulamada satın alma çalışmaz.
//  - Reklam: AdMob hesabı açılır, @capacitor-community/admob ile `showRewarded` ve `Banner` değiştirilir.
//    Banner yüksekliği BANNER_H ile aynı tutulursa arayüz yerleşimi değişmez.

export const TEST_MODE = true;
export const BANNER_H = 50;

// Elmas paketleri (fiyatlar örnek; gerçek fiyat App Store'da ülkeye göre belirlenir)
export const GEM_PACKS = [
  { id: 'gems_s', gems: 100, bonus: 0, price: '₺29,99' },
  { id: 'gems_m', gems: 500, bonus: 10, price: '₺129,99' },
  { id: 'gems_l', gems: 1200, bonus: 20, price: '₺279,99', tag: 'EN POPÜLER' },
  { id: 'gems_xl', gems: 3000, bonus: 35, price: '₺599,99', tag: 'EN İYİ DEĞER' },
];
export const packTotal = (p) => Math.round(p.gems * (1 + p.bonus / 100));

// Elmasla alınanlar. Altın miktarı bölgenin şu anki siparişinin değerine göre ölçeklenir.
export const SHOP_ITEMS = [
  { id: 'gold_s', icon: 'coin', name: 'Altın Kesesi', gems: 40, gold: 1.0 },
  { id: 'gold_l', icon: 'chest', name: 'Altın Sandığı', gems: 150, gold: 4.5 },
  { id: 'boost_30', icon: 'bolt', name: 'Bereket · 30 dk', gems: 60, boost: 30 },
  { id: 'boost_120', icon: 'bolt', name: 'Bereket · 2 saat', gems: 200, boost: 120 },
  { id: 'seals_5', icon: 'seal', name: 'Mühür Kesesi · 5', gems: 120, seals: 5 },
];

// Ödüllü reklamlar
export const AD_DAILY_LIMIT = 12;
export const AD_BOOST_MIN = 5;          // reklamla bereket süresi (dk)
export const AD_GOLD_FACTOR = 0.35;     // reklamla altın = sipariş değeri x bu
const AD_SECONDS = 15;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function adsLeft(profile) {
  const a = profile.data.ads;
  return a?.day === today() ? Math.max(0, AD_DAILY_LIMIT - a.n) : AD_DAILY_LIMIT;
}

function markAd(profile) {
  const left = adsLeft(profile);
  profile.data.ads = { day: today(), n: AD_DAILY_LIMIT - left + 1 };
  profile.save();
}

// Ödüllü reklamı göster; sonuna kadar izlenirse true döner
export function showRewarded(profile, title) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.id = 'ad-overlay';
    el.innerHTML = `
      <div class="ad-frame">
        <span class="ad-tag">${TEST_MODE ? 'TEST REKLAMI' : 'REKLAM'}</span>
        <div class="ad-art">⚒️</div>
        <div class="ad-title">${title}</div>
        <div class="ad-sub">Reklam bitince ödül krallığına eklenir</div>
        <div class="ad-progress"><div></div></div>
        <div class="ad-timer"></div>
      </div>
      <button class="ad-close" aria-label="Kapat">✕</button>`;
    document.getElementById('app').appendChild(el);
    const timer = el.querySelector('.ad-timer');
    const bar = el.querySelector('.ad-progress div');
    const close = el.querySelector('.ad-close');
    let left = AD_SECONDS;
    const tick = () => {
      timer.textContent = left > 0 ? `Ödül için ${left} sn` : 'Ödül kazandın! Kapat →';
      bar.style.width = `${((AD_SECONDS - left) / AD_SECONDS) * 100}%`;
    };
    tick();
    const iv = setInterval(() => {
      left--;
      tick();
      if (left <= 0) { clearInterval(iv); close.classList.add('done'); }
    }, 1000);
    close.onclick = () => {
      clearInterval(iv);
      el.remove();
      const ok = left <= 0;
      if (ok) markAd(profile);
      resolve(ok);
    };
  });
}

// Satın alma (test modunda onay penceresiyle simüle edilir)
export function buyPack(pack) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.id = 'buy-confirm';
    el.innerHTML = `
      <div class="modal-card">
        <h2>Satın alma</h2>
        <p class="bc-line"><b>${packTotal(pack).toLocaleString('tr-TR')}</b> elmas · <b>${pack.price}</b></p>
        ${TEST_MODE ? '<p class="bc-test">Test modu: gerçek ödeme alınmaz.</p>' : ''}
        <div class="card-row">
          <button class="go-btn alt" data-bc="cancel">Vazgeç</button>
          <button class="go-btn" data-bc="ok">Satın al</button>
        </div>
      </div>`;
    document.getElementById('app').appendChild(el);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-bc]');
      if (!b) return;
      el.remove();
      resolve(b.dataset.bc === 'ok');
    });
  });
}

// ---------- Alt reklam bandı (yer tutucu) ----------
// Gerçek sürümde AdMob banner'ı bu alanın yerine ekranın en altına yerleşir; alan her ekranda sabit kalır.
const HOUSE_ADS = [
  { text: '💎 Elmas paketlerinde %35\'e varan bonus!', go: 'gems' },
  { text: '📺 Reklam izle, 5 dakika 2 kat kaynak!', go: 'free' },
  { text: '⚡ Bereketle atölyelerin iki kat hızlı çalışsın', go: 'shop' },
  { text: '🪙 Ücretsiz altın için reklam izle', go: 'free' },
];

export function startBanner(el, onTap) {
  let i = 0;
  const show = () => {
    const ad = HOUSE_ADS[i++ % HOUSE_ADS.length];
    el.querySelector('.banner-text').textContent = ad.text;
    el.dataset.go = ad.go;
  };
  show();
  setInterval(show, 7000);
  el.addEventListener('click', () => onTap(el.dataset.go));
}
