// Kalıcı oyuncu profili: bölge ilerlemeleri, Krallık Ambarı, mühürler, haftalık sefer ve pasif kervan akışı.
import { META, exportRate, OFFLINE_CAP_H, OFFLINE_EFFICIENCY, REGION_UNLOCK_LEVEL, TROPHY_BONUS } from './config.js';
import { REGIONS, regionIndex } from './regions/index.js';
import { WEEK_MS, weekBoss, bounty, victorySeals } from './bosses.js';

const KEY = 'forgemaster.save.v3';
const OLD_KEYS = ['forgemaster.save.v2', 'forgemaster.save.v1'];

function blankRegion(def, meta) {
  return {
    gold: (def.startGold || 0) + (meta.startGold || 0) * 150,
    levels: {},
    unlocked: [],
    padPaid: {},
    tut: 0,
    delivered: {},
    level: 0,
    visited: false,
  };
}

export class Profile {
  constructor() {
    this.resetting = false;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* bozuk kayıt */ }
    this.data = d || this.migrate();
    d = this.data;
    d.meta ||= {};
    d.capital ||= {};
    d.exportAcc ||= {};
    d.regions ||= {};
    d.seals ||= 0;
    d.lastSeen ||= Date.now();
    if (!REGIONS.some((r) => r.id === d.current)) d.current = 'village';
    this.ensureCampaign();
  }

  // Önceki sürümlerin kaydını yeni yapıya taşır (yıldız → sipariş seviyesi, Ambar korunur)
  migrate() {
    const d = { v: 3, current: 'village', seals: 0, meta: {}, capital: {}, exportAcc: {}, regions: {}, lastSeen: Date.now() };
    try {
      const v2 = JSON.parse(localStorage.getItem(OLD_KEYS[0]) || 'null');
      if (v2) {
        d.current = v2.current || 'village';
        d.seals = v2.seals || 0;
        d.capital = v2.capital || {};
        for (const [id, r] of Object.entries(v2.regions || {})) {
          d.regions[id] = { ...blankRegion({}, {}), ...r, gold: r.gold || 0, level: r.stars || 0, delivered: {} };
          delete d.regions[id].stars;
        }
      } else {
        const v1 = JSON.parse(localStorage.getItem(OLD_KEYS[1]) || 'null');
        if (v1) {
          const r = blankRegion({}, {});
          r.gold = v1.gold | 0;
          r.levels = { ...(v1.levels || {}) };
          delete r.levels.collier;
          r.unlocked = (v1.unlocked || []).filter((u) => u === 'anvil' || u === 'bench');
          r.padPaid = v1.padPaid || {};
          r.visited = true;
          d.regions.village = r;
        }
      }
      for (const k of OLD_KEYS) localStorage.removeItem(k);
    } catch { /* yok say */ }
    return d;
  }

  get current() { return this.data.current; }
  set current(id) { this.data.current = id; }

  region(id) {
    const d = this.data;
    if (!d.regions[id]) d.regions[id] = blankRegion(REGIONS.find((r) => r.id === id) || {}, d.meta);
    return d.regions[id];
  }

  level(id) { return this.data.regions[id]?.level || 0; }
  totalLevels() { return REGIONS.reduce((s, r) => s + this.level(r.id), 0); }

  // İlk bölge hep açık; diğerleri bir öncekinde 3 sipariş bitince açılır
  isOpen(id) {
    const i = regionIndex(id);
    if (i <= 0) return true;
    return this.level(REGIONS[i - 1].id) >= REGION_UNLOCK_LEVEL;
  }

  // ---------- sonsuz siparişler ----------
  // İlk siparişler bölge verisinde; sonrakiler sonuncunun büyütülmüş hali
  orderFor(def, level) {
    const list = def.orders;
    if (level < list.length) return list[level];
    const k = Math.pow(def.orderGrowth || 1.3, level - list.length + 1);
    return Object.fromEntries(Object.entries(list[list.length - 1]).map(([t, n]) => [t, Math.ceil(n * k)]));
  }

  // ---------- mühür bonusları ----------
  meta(id) { return this.data.meta[id] || 0; }

  buyMeta(id) {
    const m = META.find((x) => x.id === id);
    const lvl = this.meta(id);
    if (lvl >= m.max) return false;
    const cost = m.cost(lvl);
    if (this.data.seals < cost) return false;
    this.data.seals -= cost;
    this.data.meta[id] = lvl + 1;
    this.save();
    return true;
  }

  priceBonus() { return (1 + TROPHY_BONUS * this.trophies().length) * (1 + 0.05 * this.meta('merchant')); }
  craftBonus() { return 1 / (1 + 0.05 * this.meta('craftsman')); }

  // ---------- Krallık Ambarı ----------
  ambar(t) { return Math.floor(this.data.capital[t] || 0); }
  addAmbar(t, n) { this.data.capital[t] = (this.data.capital[t] || 0) + n; }
  takeAmbar(t, n) {
    const have = this.ambar(t);
    const k = Math.min(have, n);
    if (k > 0) this.data.capital[t] -= k;
    return k;
  }

  workersIn(def) {
    const lv = this.data.regions[def.id]?.levels || {};
    return (def.workers || []).reduce((s, w) => s + (lv[w.id] || 0), 0);
  }

  // En az bir siparişi bitmiş bölgeler, malzemesini kervanla Ambar'a yollar
  tickExports(sec, eff = 1) {
    const d = this.data;
    const gained = {};
    for (const def of REGIONS) {
      if (this.level(def.id) < 1) continue;
      const t = def.exports;
      d.exportAcc[t] = (d.exportAcc[t] || 0) + (exportRate(this.workersIn(def), this.meta('passive')) * sec * eff) / 60;
      const whole = Math.floor(d.exportAcc[t]);
      if (whole > 0) {
        d.exportAcc[t] -= whole;
        this.addAmbar(t, whole);
        gained[t] = (gained[t] || 0) + whole;
      }
    }
    return gained;
  }

  // Oyun kapalıyken geçen süre (en fazla 8 saat, yarı verimle)
  collectOffline() {
    const sec = Math.min((Date.now() - (this.data.lastSeen || Date.now())) / 1000, OFFLINE_CAP_H * 3600);
    this.data.lastSeen = Date.now();
    return sec > 60 ? { sec, gained: this.tickExports(sec, OFFLINE_EFFICIENCY) } : null;
  }

  // ---------- haftalık sefer ----------
  // Her 7 günde yeni düşman. Süre dolunca sefer kapanır ve sıradaki başlar.
  ensureCampaign(now = Date.now()) {
    const d = this.data;
    const rolled = [];
    if (!d.campaign) d.campaign = { start: now, week: 0, given: [], won: false, history: [], bountyN: 0 };
    const c = d.campaign;
    while (now >= c.start + WEEK_MS) {
      const b = weekBoss(c.week);
      const progress = this.weaponProgress();
      rolled.push({ week: c.week, name: b.name, won: c.won, progress });
      // yenilemeyen düşman için ilerlemeye göre teselli mührü
      if (!c.won) d.seals += Math.floor(progress * 6);
      c.history.push({ week: c.week, boss: b.id, won: c.won });
      c.week++;
      c.start += WEEK_MS;
      c.given = [];
      c.won = false;
      c.bountyN = 0;
    }
    return rolled;
  }

  get campaign() { return this.data.campaign; }
  boss() { return weekBoss(this.campaign.week); }
  timeLeft(now = Date.now()) { return this.campaign.start + WEEK_MS - now; }
  trophies() { return this.campaign.history.filter((h) => h.won).map((h) => h.boss).concat(this.campaign.won ? [this.boss().id] : []); }

  given(part, t) { return this.campaign.given[part]?.[t] || 0; }

  partProgress(part) {
    let have = 0, need = 0;
    for (const [t, n] of Object.entries(part.needs)) { have += Math.min(n, this.given(part.id, t)); need += n; }
    return have / need;
  }

  weaponProgress() {
    const parts = this.boss().parts;
    return parts.reduce((s, p) => s + this.partProgress(p), 0) / parts.length;
  }

  weaponReady() { return this.boss().parts.every((p) => this.partProgress(p) >= 1); }

  // Ambar'daki malzemeyi silahın bir parçasına aktar; aktarılan toplamı döndürür
  contribute(partId) {
    const part = this.boss().parts[partId];
    const c = this.campaign;
    c.given[partId] ||= {};
    let moved = 0;
    for (const [t, n] of Object.entries(part.needs)) {
      const k = this.takeAmbar(t, n - this.given(partId, t));
      c.given[partId][t] = this.given(partId, t) + k;
      moved += k;
    }
    this.save();
    return moved;
  }

  winBoss() {
    const c = this.campaign;
    if (c.won || !this.weaponReady()) return 0;
    c.won = true;
    const s = victorySeals(c.week);
    this.data.seals += s;
    this.save();
    return s;
  }

  // Zaferden sonra: sonsuz Kraliyet Görevleri
  bounty() { return bounty(this.campaign.bountyN); }

  fulfillBounty() {
    const b = this.bounty();
    if (this.ambar(b.type) < b.amount) return 0;
    this.takeAmbar(b.type, b.amount);
    this.campaign.bountyN++;
    this.data.seals += b.seals;
    this.save();
    return b.seals;
  }

  save() {
    if (this.resetting) return;
    this.data.lastSeen = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* depolama kapalı olabilir */ }
  }

  reset() {
    this.resetting = true;
    try { localStorage.removeItem(KEY); for (const k of OLD_KEYS) localStorage.removeItem(k); } catch { /* yok say */ }
    location.reload();
  }
}
