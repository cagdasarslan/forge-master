// Mağaza (elmas paketleri), ödüllü reklamlar ve alt reklam bandı.
//
// Android'de gerçek AdMob (banner + ödüllü) ve Google Play Billing (cordova-plugin-purchase) kullanılır.
// Tarayıcıda ve iOS'ta TEST MODU: satın almalar ve reklamlar simüle edilir.
//
// Yayından önce AD_UNITS ve android/app/src/main/res/values/strings.xml içindeki admob_app_id
// gerçek AdMob kimlikleriyle değiştirilir (bkz. PLAY_STORE.md). Google'ın test kimlikleri kalırsa reklamlar
// "Test Ad" olarak görünür ve gelir getirmez.
import { Capacitor } from '@capacitor/core';

export const NATIVE = Capacitor.getPlatform() === 'android';
export const TEST_MODE = !NATIVE;
export const BANNER_H = 50;

// AdMob reklam birimleri (şu an Google'ın resmi test kimlikleri)
const AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
};
const ADS_TESTING = AD_UNITS.banner.startsWith('ca-app-pub-3940256099942544');

// Elmas paketleri. Ürün kimlikleri Play Console → Uygulama içi ürünler'deki kimliklerle aynı olmalı.
// price: mağaza fiyatı yüklenene kadar gösterilen örnek; Android'de Play'in yerel fiyatı yazılır.
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

// ---------- Başlatma ----------
let AdMob = null;
let admobReady = false;
let privacyRequired = false;
let rewardedLoaded = null;      // yüklenmiş ödüllü reklam için Promise
let onGems = () => {};          // satın alınan elmasları profile ekleyen geri çağrı (ui verir)

// Açılışta bir kez çağrılır. grantGems(n, packId): onaylanan satın almanın elmasını ekler.
export async function initMonetization({ grantGems }) {
  onGems = grantGems;
  if (!NATIVE) return;
  initBilling().catch((e) => console.warn('billing', e));
  try {
    ({ AdMob } = await import('@capacitor-community/admob'));
    await AdMob.initialize({ initializeForTesting: ADS_TESTING });
    // Avrupa'daki oyuncular için Google UMP rıza formu (gerekiyorsa)
    try {
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
      const after = await AdMob.requestConsentInfo();
      privacyRequired = after.privacyOptionsRequirementStatus === 'REQUIRED';
      if (!after.canRequestAds && after.status !== 'NOT_REQUIRED' && after.status !== 'OBTAINED') return;
    } catch (e) { console.warn('consent', e); }
    admobReady = true;
    showBanner();
    preloadRewarded();
  } catch (e) {
    console.warn('admob', e);
  }
}

// Ayarlarda "Gizlilik seçenekleri" düğmesi gösterilmeli mi (AB rıza formu)
export const privacyOptionsAvailable = () => privacyRequired;
export async function showPrivacyOptions() {
  try { await AdMob?.showPrivacyOptionsForm(); } catch (e) { console.warn('privacy', e); }
}

// ---------- Ödüllü reklam ----------
function preloadRewarded() {
  if (!admobReady) return null;
  rewardedLoaded = AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded, isTesting: ADS_TESTING })
    .then(() => true)
    .catch((e) => { console.warn('rewarded load', e); rewardedLoaded = null; return false; });
  return rewardedLoaded;
}

async function showNativeRewarded() {
  if (!admobReady) return 'unavailable';
  const loaded = await (rewardedLoaded || preloadRewarded());
  rewardedLoaded = null;
  if (!loaded) { preloadRewarded(); return 'unavailable'; }
  // showRewardVideoAd yalnız ödül kazanılınca döner; erken kapatmada hiç dönmez. Bu yüzden olaylarla beklenir:
  // ödül (Rewarded) reklam açıkken gelir, sonuç reklam kapanınca (Dismissed) verilir.
  const { RewardAdPluginEvents } = await import('@capacitor-community/admob');
  let earned = false;
  const subs = [];
  try {
    return await new Promise((resolve) => {
      const on = (ev, fn) => AdMob.addListener(ev, fn).then((h) => subs.push(h));
      Promise.all([
        on(RewardAdPluginEvents.Rewarded, () => { earned = true; }),
        on(RewardAdPluginEvents.Dismissed, () => resolve(earned ? 'ok' : 'skipped')),
        on(RewardAdPluginEvents.FailedToShow, () => resolve('unavailable')),
      ]).then(() => AdMob.showRewardVideoAd())
        .then(() => { earned = true; })
        .catch((e) => { console.warn('rewarded show', e); resolve('unavailable'); });
    });
  } finally {
    for (const h of subs) h.remove();
    preloadRewarded();
  }
}

// Ödüllü reklamı göster; sonuna kadar izlenirse true döner. Reklam yüklenemezse 'unavailable' döner.
export async function showRewarded(profile, title) {
  if (NATIVE) {
    const r = await showNativeRewarded();
    if (r === 'ok') markAd(profile);
    return r === 'ok' ? true : r === 'unavailable' ? 'unavailable' : false;
  }
  return showFakeRewarded(profile, title);
}

function showFakeRewarded(profile, title) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.id = 'ad-overlay';
    el.innerHTML = `
      <div class="ad-frame">
        <span class="ad-tag">TEST REKLAMI</span>
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

// ---------- Google Play Billing ----------
let store = null;
const GRANTED_KEY = 'forgemaster.iap.granted';

// Aynı satın almanın elmasını iki kez vermemek için işlenen sipariş kimlikleri
function grantedIds() {
  try { return JSON.parse(localStorage.getItem(GRANTED_KEY) || '[]'); } catch { return []; }
}
function markGranted(id) {
  const a = grantedIds();
  a.push(id);
  try { localStorage.setItem(GRANTED_KEY, JSON.stringify(a.slice(-200))); } catch { /* yok say */ }
}

async function initBilling() {
  // cordova eklentisi deviceready'den sonra hazır olur
  await new Promise((r) => (window.CdvPurchase ? r() : document.addEventListener('deviceready', r, { once: true })));
  const { store: s, ProductType, Platform, LogLevel } = window.CdvPurchase;
  store = s;
  store.verbosity = LogLevel.WARNING;
  store.register(GEM_PACKS.map((p) => ({ id: p.id, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY })));
  store.when()
    .productUpdated((product) => {
      const pack = GEM_PACKS.find((p) => p.id === product.id);
      if (pack && product.pricing?.price) pack.price = product.pricing.price;
    })
    .approved((tx) => {
      // Elmas önce verilir, sonra işlem tüketilir; uygulama arada kapanırsa açılışta yeniden onaylanır
      const key = tx.transactionId;
      if (!grantedIds().includes(key)) {
        for (const pr of tx.products) {
          const pack = GEM_PACKS.find((p) => p.id === pr.id);
          if (pack) onGems(packTotal(pack) * (tx.quantity || 1), pack.id);
        }
        markGranted(key);
      }
      tx.finish();
    });
  store.error((e) => console.warn('billing error', e));
  await store.initialize([Platform.GOOGLE_PLAY]);
}

// Satın alma. Android'de Play ödeme ekranı açılır; elmas approved olayında onGems ile verilir.
// Dönen değer: true (ödeme başladı/bitti), false (vazgeçildi), 'unavailable' (mağaza hazır değil).
export async function buyPack(pack) {
  if (NATIVE) {
    const offer = store?.get(pack.id)?.getOffer();
    if (!offer) return 'unavailable';
    const err = await store.order(offer);
    if (err) {
      if (err.code === window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) return false;
      console.warn('order', err);
      return 'unavailable';
    }
    return true;
  }
  const ok = await fakeConfirm(pack);
  if (ok) onGems(packTotal(pack), pack.id);
  return ok;
}

function fakeConfirm(pack) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.id = 'buy-confirm';
    el.innerHTML = `
      <div class="modal-card">
        <h2>Satın alma</h2>
        <p class="bc-line"><b>${packTotal(pack).toLocaleString('tr-TR')}</b> elmas · <b>${pack.price}</b></p>
        <p class="bc-test">Test modu: gerçek ödeme alınmaz.</p>
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

// ---------- Alt reklam bandı ----------
// Android'de AdMob banner'ı ekranın en altındaki ayrılmış 50 px'lik alana yerleşir (HTML bandı gizlenir).
// Tarayıcıda/iOS'ta yerine kendi tanıtımlarımız döner.
async function showBanner() {
  try {
    const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: AD_UNITS.banner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: ADS_TESTING,
    });
  } catch (e) {
    console.warn('banner', e);
  }
}

const HOUSE_ADS = [
  { text: '💎 Elmas paketlerinde %35\'e varan bonus!', go: 'gems' },
  { text: '📺 Reklam izle, 5 dakika 2 kat kaynak!', go: 'free' },
  { text: '⚡ Bereketle atölyelerin iki kat hızlı çalışsın', go: 'shop' },
  { text: '🪙 Ücretsiz altın için reklam izle', go: 'free' },
];

export function startBanner(el, onTap) {
  if (NATIVE) {
    // yer ayrılmış kalır, üstüne yerel AdMob görünümü çizilir
    el.classList.add('native');
    el.querySelector('.banner-text').textContent = '';
    return;
  }
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
