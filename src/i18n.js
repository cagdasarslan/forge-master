// Dil: Türkçe ve İngilizce. Seçim cihazda saklanır; ilk açılışta cihaz diline göre seçilir.
//   L('Türkçe', 'English')  arayüz metinleri (değişkenli şablonlar dahil)
//   T('Türkçe metin')       veri metinleri, src/lang/en.js sözlüğünden
import EN_DICT from './lang/en.js';

const KEY = 'forgemaster.lang';

function detect() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'tr' || v === 'en') return v;
  } catch { /* yok say */ }
  return (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export const LANG = detect();
export const IS_EN = LANG === 'en';
export const LOCALE = IS_EN ? 'en-US' : 'tr-TR';
document.documentElement.lang = LANG;

export const L = (tr, en) => (IS_EN ? en : tr);
export const T = (s) => (IS_EN && typeof s === 'string' && EN_DICT[s]) || s;

// Dili değiştirir; yerdeki yazılar ve modeller yeniden çizilsin diye sayfa yenilenir
export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch { /* yok say */ }
  location.reload();
}

// Veri nesnelerindeki metin alanlarını yerinde çevirir (açılışta bir kez)
const FIELDS = new Set(['name', 'label', 'intro', 'story', 'weapon', 'text']);
export function localizeData(...roots) {
  if (!IS_EN) return;
  const seen = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') { if (FIELDS.has(k)) o[k] = T(v); } else if (typeof v === 'object') walk(v);
    }
  };
  for (const r of roots) walk(r);
}
