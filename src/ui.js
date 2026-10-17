// HUD: altın, sipariş, görev şeridi, dünya üstü baloncuklar, Lonca paneli,
// Krallık Haritası (bölgeler, başkent, mühürler), sıralama, hesap ayarları ve açılır pencereler.
// Metinler iki dilli: L('Türkçe', 'English'), veri metinleri T() / localizeData ile (src/i18n.js).
import * as THREE from 'three';
import { ITEMS, META, exportRate, REGION_UNLOCK_LEVEL, orderSeals, TROPHY_BONUS, FIGHT_TIME } from './config.js';
import { REGIONS, CAPITAL, regionIndex } from './regions/index.js';
import { BOSSES } from './bosses.js';
import { iconImg } from './icons.js';
import { sfx } from './audio.js';
import { L, LANG, LOCALE, IS_EN, setLang } from './i18n.js';
import { cloud } from './cloud.js';
import { computePower, powerParts } from './power.js';
import {
  GEM_PACKS, SHOP_ITEMS, packTotal, AD_DAILY_LIMIT, AD_BOOST_MIN, AD_GOLD_FACTOR, TEST_MODE,
  adsLeft, showRewarded, buyPack, startBanner, privacyOptionsAvailable, showPrivacyOptions,
} from './monetization.js';

const tmp = new THREE.Vector3();
const PERIODS = [
  ['week', L('Haftalık', 'Weekly')],
  ['month', L('Aylık', 'Monthly')],
  ['year', L('Yıllık', 'Yearly')],
  ['all', L('Genel', 'All time')],
];

export class UI {
  constructor(root) {
    this.root = root;
    this.bubbles = [];
    this.floaters = [];
    this.game = null;
    this.profile = null;
    this.camera = null;
    this.onTravel = null;
    this.shownGold = 0;
    this.gold = 0;
    this.orderKey = '';

    root.insertAdjacentHTML('beforeend', `
      <div id="hud">
        <div id="topbar">
          <div class="top-left">
            <div id="gold">${iconImg('coin')}<span id="gold-val">0</span></div>
            <button id="order" aria-label="${L('Kraliyet Siparişi', 'Royal Order')}"></button>
            <button id="sefer" aria-label="${L('Haftanın seferi', 'Weekly campaign')}"></button>
          </div>
          <div class="top-right">
            <button id="gems" aria-label="${L('Mağaza', 'Store')}">${iconImg('gem')}<span class="gem-val">0</span><i>+</i></button>
            <button id="btn-map" class="round-btn map-btn" aria-label="${L('Harita', 'Map')}">${iconImg('map')}</button>
            <button id="btn-menu" class="round-btn map-btn" aria-label="${L('Ana menü', 'Main menu')}">${iconImg('home')}</button>
          </div>
        </div>
        <div id="boost" hidden>${iconImg('bolt')}<span>${L('x2 BEREKET', 'x2 BOOST')}</span><b></b></div>
        <div id="ad-btns">
          <button id="ad-boost" class="ad-btn">${iconImg('tv', 'ico tv')}${iconImg('bolt')}<small>x2 · ${AD_BOOST_MIN} ${L('dk', 'min')}</small></button>
          <button id="ad-gold" class="ad-btn">${iconImg('tv', 'ico tv')}${iconImg('coin')}<small class="ad-gold-val">+0</small></button>
        </div>
        <div id="objective" hidden><span class="obj-step"></span><span class="obj-text"></span></div>
        <div id="toasts"></div>
        <div id="world-layer"></div>
        <button id="btn-upgrade">${iconImg('hammer')}<span>${L('GELİŞTİR', 'UPGRADE')}</span><i class="badge" hidden>!</i></button>
        <button id="btn-dump" hidden aria-label="${L('Bırakılamayan malı at', 'Drop stuck items')}"></button>
      </div>
      <div id="joy" hidden><div class="joy-knob"></div></div>
      <div id="panel" class="sheet" hidden>
        <div class="panel-card">
          <div class="panel-head">
            <div class="panel-title">${L('LONCA', 'GUILD')}</div>
            <div class="panel-gold">${iconImg('coin')}<span class="pg-val">0</span></div>
            <button class="panel-close" aria-label="${L('Kapat', 'Close')}">✕</button>
          </div>
          <div class="panel-tabs">
            <button data-tab="smith" class="on">${L('Usta', 'Smith')}</button>
            <button data-tab="crew">${L('İşçiler', 'Crew')}</button>
            <button data-tab="army">${L('Ordu', 'Army')}</button>
          </div>
          <div class="panel-list"></div>
        </div>
      </div>
      <div id="map" hidden>
        <div class="map-head">
          <div class="map-title">${L('Krallık Haritası', 'Kingdom Map')}</div>
          <div class="map-seals">${iconImg('seal')}<span class="seal-val">0</span></div>
          <button class="panel-close map-close" aria-label="${L('Kapat', 'Close')}">✕</button>
        </div>
        <div class="map-board">
          <svg class="map-paths" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
          <div class="map-deco"></div>
          <div class="map-nodes"></div>
        </div>
        <div class="map-card"></div>
      </div>
      <div id="menu">
        <div class="menu-art">
          <div class="menu-sparks"></div>
          ${iconImg('hammer', 'ico menu-logo')}
          <h1>FORGE<b>MASTER</b></h1>
          <p class="menu-sub">${L('Krallığın demircisi', 'Smith of the kingdom')}</p>
        </div>
        <div class="menu-info"></div>
        <div class="menu-buttons">
          <button class="go-btn menu-play" data-menu="play">${L('OYNA', 'PLAY')}</button>
          <div class="card-row">
            <button class="go-btn alt" data-menu="map">${iconImg('map')} ${L('Harita', 'Map')}</button>
            <button class="go-btn alt" data-menu="ranks">${iconImg('trophy')} ${L('Sıralama', 'Ranking')}</button>
          </div>
          <div class="card-row">
            <button class="go-btn alt" data-menu="store">${iconImg('store')} ${L('Mağaza', 'Store')}</button>
            <button class="go-btn alt" data-menu="settings">${iconImg('gear')} ${L('Ayarlar', 'Settings')}</button>
          </div>
        </div>
      </div>
      <div id="store" hidden>
        <div class="panel-card">
          <div class="panel-head">
            <div class="panel-title">${L('MAĞAZA', 'STORE')}</div>
            <div class="panel-gold">${iconImg('gem')}<span class="st-gems">0</span></div>
            <button class="panel-close st-close" aria-label="${L('Kapat', 'Close')}">✕</button>
          </div>
          <div class="panel-tabs st-tabs">
            <button data-st="gems" class="on">${L('Elmas', 'Gems')}</button>
            <button data-st="shop">${L('Dükkan', 'Shop')}</button>
            <button data-st="free">${L('Ücretsiz', 'Free')}</button>
          </div>
          <div class="panel-list st-list"></div>
        </div>
      </div>
      <div id="ranks" hidden>
        <div class="panel-card">
          <div class="panel-head">
            <div class="panel-title">${L('SIRALAMA', 'RANKING')}</div>
            <div class="panel-gold">${iconImg('power')}<span class="rk-power">0</span></div>
            <button class="panel-close rk-close" aria-label="${L('Kapat', 'Close')}">✕</button>
          </div>
          <div class="panel-tabs rk-tabs">${PERIODS.map(([id, name], i) => `<button data-rk="${id}" class="${i ? '' : 'on'}">${name}</button>`).join('')}</div>
          <div class="panel-list rk-list"></div>
        </div>
      </div>
      <div id="settings" hidden>
        <div class="panel-card">
          <div class="panel-head">
            <div class="panel-title">${L('AYARLAR', 'SETTINGS')}</div>
            <button class="panel-close set-close" aria-label="${L('Kapat', 'Close')}">✕</button>
          </div>
          <div class="panel-list set-list"></div>
        </div>
      </div>
      <div id="modal" hidden><div class="modal-card"></div></div>
      <div id="fade" hidden></div>
      <button id="banner" aria-label="${L('Reklam', 'Ad')}"><span class="ad-label">${L('REKLAM', 'AD')}</span><span class="banner-text"></span></button>
    `);
    const q = (s) => root.querySelector(s);
    this.el = {
      gold: q('#gold-val'), goldBox: q('#gold'), order: q('#order'), sefer: q('#sefer'),
      obj: q('#objective'), objText: q('.obj-text'), objStep: q('.obj-step'),
      toasts: q('#toasts'), layer: q('#world-layer'),
      upBtn: q('#btn-upgrade'), badge: q('#btn-upgrade .badge'),
      panel: q('#panel'), list: q('.panel-list'), pgVal: q('.pg-val'),
      joy: q('#joy'),
      map: q('#map'), mapPaths: q('.map-paths'), mapNodes: q('.map-nodes'), mapDeco: q('.map-deco'), mapCard: q('.map-card'),
      sealVal: q('.seal-val'), mapClose: q('.map-close'),
      modal: q('#modal'), modalCard: q('.modal-card'), fade: q('#fade'),
      gems: q('.gem-val'), boost: q('#boost'), boostT: q('#boost b'), adGoldVal: q('.ad-gold-val'),
      menu: q('#menu'), menuInfo: q('.menu-info'), store: q('#store'), stList: q('.st-list'), stGems: q('.st-gems'),
      ranks: q('#ranks'), rkList: q('.rk-list'), rkPower: q('.rk-power'),
      settings: q('#settings'), setList: q('.set-list'),
    };
    this.storeTab = 'gems';
    this.rankTab = 'week';
    this.setupMonetization(q);
    this.setupRanks();
    this.setupSettings();
    this.tab = 'smith';
    this.el.upBtn.addEventListener('click', () => this.openPanel());
    this.el.dump = q('#btn-dump');
    this.el.dump.addEventListener('click', () => this.game?.dumpBackpack());
    this.el.panel.querySelector('.panel-close').addEventListener('click', () => this.closePanel());
    this.el.panel.addEventListener('pointerdown', (e) => { if (e.target === this.el.panel) this.closePanel(); });
    for (const b of this.el.panel.querySelectorAll('.panel-tabs button')) {
      b.addEventListener('click', () => {
        this.tab = b.dataset.tab;
        for (const o of this.el.panel.querySelectorAll('.panel-tabs button')) o.classList.toggle('on', o === b);
        this.refreshUpgrades();
      });
    }
    this.el.list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-up]');
      if (b) {
        if (this.game.buyUpgrade(b.dataset.up)) b.closest('.up-row').classList.add('bought');
        this.refreshUpgrades();
      }
      const rec = e.target.closest('[data-recruit]');
      if (rec) {
        if (this.game.recruit(rec.dataset.recruit)) rec.closest('.up-row').classList.add('bought');
        this.refreshUpgrades();
      }
      if (e.target.closest('[data-act=attack]')) this.attackGuardian();
    });
    try {
      if (localStorage.getItem('forgemaster.sound') === '0') sfx.setOn(false);
    } catch { /* yok say */ }

    // harita
    q('#btn-map').addEventListener('click', () => this.openMap());
    this.el.order.addEventListener('click', () => this.openMap(this.game?.region.id));
    this.el.sefer.addEventListener('click', () => this.openMap('capital'));
    this.el.mapClose.addEventListener('click', () => this.closeMap());
    this.el.mapNodes.addEventListener('click', (e) => {
      const n = e.target.closest('[data-node]');
      if (n) { sfx.pop(2); this.selectNode(n.dataset.node); }
    });
    this.el.mapCard.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) this.travel(go.dataset.go);
      const m = e.target.closest('[data-meta]');
      if (m) {
        if (this.profile.buyMeta(m.dataset.meta)) { sfx.buy(); this.game?.refreshPlayerStats(); } else sfx.deny();
        this.renderMap();
        this.selectNode('seals');
      }
      if (e.target.closest('[data-act=seals]')) this.selectNode('seals');
      if (e.target.closest('[data-act=capital]')) this.selectNode('capital');
      if (e.target.closest('[data-act=ambar]')) this.selectNode('ambar');
      const part = e.target.closest('[data-part]');
      if (part) {
        const ids = part.dataset.part === 'all' ? this.profile.boss().parts.map((x) => x.id) : [Number(part.dataset.part)];
        const moved = ids.reduce((s, id) => s + this.profile.contribute(id), 0);
        if (moved) sfx.buy(); else sfx.deny();
        this.renderMap();
        this.selectNode('capital');
      }
      if (e.target.closest('[data-act=battle]')) this.startBattle();
      if (e.target.closest('[data-act=bounty]')) {
        const got = this.profile.fulfillBounty();
        if (got) { sfx.unlock2(); this.toast(`+${got} ${L('Mühür', 'Seals')}`); } else sfx.deny();
        this.renderMap();
        this.selectNode('capital');
      }
    });
    this.el.modal.addEventListener('click', (e) => {
      const b = e.target.closest('[data-modal]');
      if (!b) return;
      if (b.dataset.modal === 'keep') return; // pencere kendi düğmesini işler
      this.closeModal();
      if (b.dataset.modal === 'map') this.openMap();
      if (b.dataset.modal === 'ranks') this.openRanks();
    });

    // bulut: hesap durumu değişince ayarlar ekranını yenile; başka cihazda yeni kayıt varsa sor
    cloud.onChange = () => { if (!this.el.settings.hidden) this.renderSettings(); };
    cloud.onConflict = (remote) => this.askConflict(remote);
  }

  icon(name) { return iconImg(name); }

  get panelOpen() {
    return !this.el.panel.hidden || !this.el.map.hidden || !this.el.modal.hidden || !this.el.menu.hidden || !this.el.store.hidden
      || !this.el.ranks.hidden || !this.el.settings.hidden || !!this.root.querySelector('#ad-overlay, #buy-confirm');
  }

  // ---------- ana menü, mağaza, reklamlar ----------
  setupMonetization(q) {
    q('#btn-menu').addEventListener('click', () => this.openMenu());
    q('#gems').addEventListener('click', () => this.openStore('gems'));
    q('#ad-boost').addEventListener('click', () => this.watchAd('boost'));
    q('#ad-gold').addEventListener('click', () => this.watchAd('gold'));
    this.el.menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-menu]');
      if (!b) return;
      sfx.unlock();
      const a = b.dataset.menu;
      if (a === 'play') this.closeMenu();
      if (a === 'map') { this.closeMenu(); this.openMap(); }
      if (a === 'ranks') this.openRanks();
      if (a === 'store') this.openStore('gems');
      if (a === 'settings') this.openSettings();
    });
    this.el.store.querySelector('.st-close').addEventListener('click', () => this.closeStore());
    this.el.store.addEventListener('pointerdown', (e) => { if (e.target === this.el.store) this.closeStore(); });
    for (const b of this.el.store.querySelectorAll('[data-st]')) {
      b.addEventListener('click', () => this.renderStore(b.dataset.st));
    }
    this.el.stList.addEventListener('click', async (e) => {
      const pack = e.target.closest('[data-pack]');
      if (pack) {
        const p = GEM_PACKS.find((x) => x.id === pack.dataset.pack);
        // elmas, satın alma onaylanınca grantGems ile eklenir
        const r = await buyPack(p);
        if (r === 'unavailable') this.toast(L('Mağazaya bağlanılamadı, biraz sonra dene', 'Could not reach the store, try again later'));
        this.renderStore();
      }
      const item = e.target.closest('[data-item]');
      if (item) this.buyItem(item.dataset.item);
      const ad = e.target.closest('[data-ad]');
      if (ad) this.watchAd(ad.dataset.ad);
    });
    startBanner(q('#banner'), (go) => this.openStore(go));
  }

  openMenu() {
    sfx.unlock();
    this.closePanel();
    this.closeMap();
    const g = this.game, P = this.profile;
    if (g) {
      const b = P.boss();
      const weapon = P.campaign.won ? L('yenildi', 'defeated') : pctStr(P.weaponProgress() * 100);
      this.el.menuInfo.innerHTML = `
        <span class="menu-power">${iconImg('power')}${L('Güç', 'Power')} <b>${fmtFull(computePower(P))}</b></span>
        <span>${iconImg(g.region.icon)}<b>${g.region.name}</b> · ${L('Sipariş', 'Order')} ${g.rs.level + 1}</span>
        <span>${iconImg(b.icon)}${L(`${b.week + 1}. hafta`, `Week ${b.week + 1}`)}: ${b.name} · ${weapon}</span>`;
    }
    this.el.menu.hidden = false;
  }

  closeMenu() { this.el.menu.hidden = true; }

  switchLang() {
    this.game?.save();
    cloud.sync(true).finally(() => setLang(IS_EN ? 'tr' : 'en'));
  }

  // Satın alma onaylandı (Play Billing'de uygulama yeniden açıldığında da gelebilir)
  grantGems(n) {
    this.profile.addGems(n);
    sfx.unlock2();
    this.toast(`+${fmt(n)} ${L('elmas', 'gems')}`);
    if (!this.el.store.hidden) this.renderStore();
    this.updateMonetization();
    cloud.sync(true); // satın alınan elmas hemen yedeklensin
  }

  // Android geri tuşu: en üstteki pencereyi kapatır. Kapatacak bir şey yoksa false döner (uygulama arka plana alınır).
  back() {
    const bc = this.root.querySelector('#buy-confirm [data-bc="cancel"]');
    if (bc) { bc.click(); return true; }
    if (this.root.querySelector('#ad-overlay')) return true;
    if (!this.el.modal.hidden) { if (!this.el.modal.dataset.locked) this.closeModal(); return true; }
    if (!this.el.store.hidden) { this.closeStore(); return true; }
    if (!this.el.ranks.hidden) { this.closeRanks(); return true; }
    if (!this.el.settings.hidden) { this.closeSettings(); return true; }
    if (!this.el.panel.hidden) { this.closePanel(); return true; }
    if (!this.el.map.hidden && this.game) { this.closeMap(); return true; }
    if (this.el.menu.hidden) { this.openMenu(); return true; }
    return false;
  }

  openStore(tab) {
    sfx.unlock();
    this.el.store.hidden = false;
    this.renderStore(tab || this.storeTab);
  }

  closeStore() { this.el.store.hidden = true; }

  adGold() { return Math.max(60, Math.round((this.game?.orderValue() || 200) * AD_GOLD_FACTOR)); }

  renderStore(tab = this.storeTab) {
    this.storeTab = tab;
    for (const b of this.el.store.querySelectorAll('[data-st]')) b.classList.toggle('on', b.dataset.st === tab);
    const P = this.profile;
    this.el.stGems.textContent = fmt(P.gems);
    const test = TEST_MODE ? `<p class="card-note">${L('Test modu: satın almalar ve reklamlar simüle edilir, gerçek ödeme alınmaz.', 'Test mode: purchases and ads are simulated, no real payment is taken.')}</p>` : '';
    if (tab === 'gems') {
      this.el.stList.innerHTML = `<div class="packs">${GEM_PACKS.map((p) => `
        <button class="pack ${p.tag ? 'featured' : ''}" data-pack="${p.id}">
          ${p.tag ? `<span class="pack-tag">${p.tag}</span>` : ''}
          ${iconImg('gem', 'ico pack-ico')}
          <b>${packTotal(p).toLocaleString(LOCALE)}</b>
          <small>${p.bonus ? `+${p.bonus}% bonus` : '&nbsp;'}</small>
          <span class="pack-price">${p.price}</span>
        </button>`).join('')}</div>${test}`;
    } else if (tab === 'shop') {
      const ov = this.game?.orderValue() || 200;
      this.el.stList.innerHTML = SHOP_ITEMS.map((it) => {
        const what = it.gold ? `${fmt(Math.round(ov * it.gold))} ${L('altın', 'gold')} (${this.game?.region.name || L('bölge', 'region')})`
          : it.boost ? L(`${it.boost} dk: kaynaklar ve atölyeler 2 kat`, `${it.boost} min: resources and workshops x2`)
            : L(`${it.seals} Krallık Mührü`, `${it.seals} Royal Seals`);
        return `<div class="up-row">
          <div class="up-ico">${iconImg(it.icon)}</div>
          <div class="up-mid"><b>${it.name}</b><small>${what}</small></div>
          <button class="buy ${P.gems < it.gems ? 'cant' : ''}" data-item="${it.id}">${iconImg('gem')}${it.gems}</button>
        </div>`;
      }).join('');
    } else {
      const left = adsLeft(P);
      const dis = left <= 0 ? 'disabled' : '';
      this.el.stList.innerHTML = `
        <div class="up-row">
          <div class="up-ico">${iconImg('bolt')}</div>
          <div class="up-mid"><b>${L(`${AD_BOOST_MIN} dakika 2 kat bereket`, `${AD_BOOST_MIN} minute x2 boost`)}</b><small>${L('Toplanan her kaynak iki tane gelir, atölyeler iki kat hızlı', 'Every gathered resource counts twice, workshops run twice as fast')}</small></div>
          <button class="buy" data-ad="boost" ${dis}>${iconImg('tv')}${L('İzle', 'Watch')}</button>
        </div>
        <div class="up-row">
          <div class="up-ico">${iconImg('coin')}</div>
          <div class="up-mid"><b>${fmt(this.adGold())} ${L('altın', 'gold')}</b><small>${L(`${this.game?.region.name || ''} bölgesine`, `for ${this.game?.region.name || ''}`)}</small></div>
          <button class="buy" data-ad="gold" ${dis}>${iconImg('tv')}${L('İzle', 'Watch')}</button>
        </div>
        <p class="card-note">${left > 0 ? L(`Bugün ${left}/${AD_DAILY_LIMIT} reklam hakkın var.`, `${left}/${AD_DAILY_LIMIT} ads left today.`) : L('Bugünkü reklam hakların bitti, yarın yenilenir.', 'No ads left today, they refresh tomorrow.')}</p>${test}`;
    }
  }

  buyItem(id) {
    const it = SHOP_ITEMS.find((x) => x.id === id);
    const P = this.profile, g = this.game;
    if (!P.spendGems(it.gems)) { sfx.deny(); this.renderStore('gems'); this.toast(L('Yeterli elmas yok', 'Not enough gems')); return; }
    if (it.gold && g) { const n = Math.round(g.orderValue() * it.gold); g.gold += n; this.setGold(g.gold); this.toast(`+${fmt(n)} ${L('altın', 'gold')}`); }
    if (it.boost) { P.addBoost(it.boost); this.toast(L(`Bereket: +${it.boost} dk`, `Boost: +${it.boost} min`)); }
    if (it.seals) { P.data.seals += it.seals; P.save(); this.toast(`+${it.seals} ${L('mühür', 'seals')}`); }
    sfx.buy();
    g?.save();
    this.renderStore();
  }

  async watchAd(kind) {
    const P = this.profile, g = this.game;
    if (adsLeft(P) <= 0) { sfx.deny(); this.toast(L('Bugünkü reklam hakların bitti', 'No ads left today')); return; }
    const gold = this.adGold();
    const ok = await showRewarded(P, kind === 'boost' ? L(`${AD_BOOST_MIN} dk 2 kat bereket`, `${AD_BOOST_MIN} min x2 boost`) : `${fmt(gold)} ${L('altın', 'gold')}`);
    if (ok === 'unavailable') { sfx.deny(); this.toast(L('Şu an reklam yok, biraz sonra dene', 'No ad available right now, try again later')); return; }
    if (!ok) return;
    if (kind === 'boost') { P.addBoost(AD_BOOST_MIN); this.toast(L(`Bereket başladı: ${AD_BOOST_MIN} dk x2`, `Boost started: ${AD_BOOST_MIN} min x2`)); }
    else if (g) { g.gold += gold; this.setGold(g.gold); g.save(); this.toast(`+${fmt(gold)} ${L('altın', 'gold')}`); }
    sfx.unlock2();
    if (!this.el.store.hidden) this.renderStore();
  }

  // Elmas, bereket sayacı ve reklam düğmeleri (saniyede bir)
  updateMonetization() {
    const P = this.profile;
    if (!P) return;
    this.el.gems.textContent = fmt(P.gems);
    const left = P.boostLeft();
    this.el.boost.hidden = left <= 0;
    if (left > 0) { const s = Math.ceil(left / 1000); this.el.boostT.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
    this.el.adGoldVal.textContent = `+${fmt(this.adGold())}`;
  }

  // ---------- sıralama ----------
  setupRanks() {
    this.el.ranks.querySelector('.rk-close').addEventListener('click', () => this.closeRanks());
    this.el.ranks.addEventListener('pointerdown', (e) => { if (e.target === this.el.ranks) this.closeRanks(); });
    for (const b of this.el.ranks.querySelectorAll('[data-rk]')) b.addEventListener('click', () => this.renderRanks(b.dataset.rk));
    this.el.rkList.addEventListener('click', (e) => {
      if (e.target.closest('[data-act=nick]')) this.askNickname();
      if (e.target.closest('[data-act=retry]')) this.renderRanks();
    });
  }

  openRanks() {
    sfx.unlock();
    this.el.ranks.hidden = false;
    this.renderRanks(this.rankTab);
  }

  closeRanks() { this.el.ranks.hidden = true; }

  async renderRanks(tab = this.rankTab) {
    this.rankTab = tab;
    for (const b of this.el.ranks.querySelectorAll('[data-rk]')) b.classList.toggle('on', b.dataset.rk === tab);
    const P = this.profile;
    this.el.rkPower.textContent = fmt(computePower(P));
    const parts = powerParts(P);
    const mine = `<div class="rk-mine">
        <div class="rk-power-row">${iconImg('power')}<b>${L('Gücün', 'Your power')}: ${fmtFull(computePower(P))}</b></div>
        <div class="rk-parts">
          <span>${iconImg('chest')}${L('Siparişler', 'Orders')} ${fmt(parts.orders)}</span>
          <span>${iconImg('army')}${L('Bekçiler', 'Guardians')} ${fmt(parts.guardians)}</span>
          <span>${iconImg('bolt')}${L('Hız', 'Speed')} ${fmt(parts.speed)}</span>
          <span>${iconImg('sword')}${L('Ordu', 'Army')} ${fmt(parts.army)}</span>
          <span>${iconImg('castle')}${L('Seferler', 'Campaigns')} ${fmt(parts.weekly)}</span>
        </div>
      </div>`;
    const note = tab === 'all'
      ? L('Genel sıralama toplam güce göredir.', 'All-time ranking is by total power.')
      : L('Bu dönemde kazandığın güç sayılır; dönem başında sıfırlanır.', 'Counts the power you gained in this period; resets when the period starts.');
    if (!cloud.enabled) {
      this.el.rkList.innerHTML = `${mine}<p class="card-note">${L('Sıralama bu sürümde kapalı.', 'Ranking is not available in this build.')}</p>`;
      return;
    }
    const nick = cloud.nickname
      ? `<div class="rk-nick">${iconImg('user')}<b>${esc(cloud.nickname)}</b><button class="link-btn dark" data-act="nick">${L('Değiştir', 'Change')}</button></div>`
      : `<div class="rk-nick need"><span>${L('Sıralamada görünmek için bir takma ad seç.', 'Pick a nickname to appear in the ranking.')}</span><button class="go-btn" data-act="nick">${L('Takma ad seç', 'Pick nickname')}</button></div>`;
    this.el.rkList.innerHTML = `${mine}${nick}<div class="rk-rows"><p class="card-note">${L('Yükleniyor…', 'Loading…')}</p></div>`;
    try {
      const { rows, me } = await cloud.leaderboard(tab);
      if (this.rankTab !== tab || this.el.ranks.hidden) return;
      const list = rows.length
        ? rows.map((r) => `<div class="rk-row ${r.me ? 'me' : ''} ${r.rank <= 3 ? 'top' + r.rank : ''}">
            <span class="rk-rank">${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
            <span class="rk-name">${esc(r.nickname)}</span>
            <span class="rk-pts">${fmtFull(r.points)}</span></div>`).join('')
        : `<p class="card-note">${L('Bu dönemde henüz kimse puan almadı. İlk sen ol!', 'No one has scored in this period yet. Be the first!')}</p>`;
      const meRow = me && cloud.nickname && !rows.some((r) => r.me)
        ? `<div class="rk-row me"><span class="rk-rank">${me.rank}</span><span class="rk-name">${esc(cloud.nickname)}</span><span class="rk-pts">${fmtFull(me.points)}</span></div>` : '';
      this.el.rkList.querySelector('.rk-rows').innerHTML = `${list}${meRow}<p class="card-note">${note}</p>`;
    } catch (e) {
      console.warn('ranks', e);
      this.el.rkList.querySelector('.rk-rows').innerHTML = `<p class="card-note">${L('Sıralamaya bağlanılamadı. İnternet bağlantını kontrol et.', 'Could not load the ranking. Check your internet connection.')}</p>
        <button class="go-btn alt" data-act="retry">${L('Tekrar dene', 'Retry')}</button>`;
    }
  }

  askNickname() {
    this.modal(`<h2>${L('Takma ad', 'Nickname')}</h2>
      <p>${L('Sıralamada bu ad görünür. 3-16 karakter; harf, rakam, boşluk, _ . -', 'Shown in the ranking. 3-16 characters; letters, numbers, space, _ . -')}</p>
      <input class="nick-input" maxlength="16" autocomplete="off" spellcheck="false" value="${esc(cloud.nickname || '')}" />
      <p class="nick-err"></p>
      <div class="card-row">
        <button class="go-btn alt" data-modal="close">${L('Vazgeç', 'Cancel')}</button>
        <button class="go-btn" data-modal="keep" data-nick="save">${L('Kaydet', 'Save')}</button>
      </div>`);
    const input = this.el.modalCard.querySelector('.nick-input');
    const err = this.el.modalCard.querySelector('.nick-err');
    input.focus();
    const save = async () => {
      err.textContent = '';
      try {
        const r = await cloud.setNickname(input.value);
        const msg = {
          invalid: L('3-16 karakter olmalı; yalnız harf, rakam, boşluk, _ . -', 'Must be 3-16 characters; letters, numbers, space, _ . - only'),
          bad: L('Bu ad kullanılamaz.', 'This name is not allowed.'),
          taken: L('Bu ad başkası tarafından alınmış.', 'This name is already taken.'),
        }[r];
        if (msg) { err.textContent = msg; sfx.deny(); return; }
        sfx.buy();
        this.closeModal();
        if (!this.el.ranks.hidden) this.renderRanks();
        if (!this.el.settings.hidden) this.renderSettings();
      } catch (e) {
        console.warn('nick', e);
        err.textContent = L('Bağlantı hatası, tekrar dene.', 'Connection error, try again.');
      }
    };
    this.el.modalCard.querySelector('[data-nick=save]').addEventListener('click', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
  }

  // ---------- altın ----------
  setGold(v) {
    this.gold = Math.floor(v);
    if (!this.el.panel.hidden) { this.el.pgVal.textContent = fmt(this.gold); this.refreshAfford(); }
  }

  // ---------- sipariş göstergesi ----------
  setOrder(v) {
    const items = v.items.map((i) => `<span class="ord-item ${i.have >= i.need ? 'ok' : ''}">${iconImg(i.type)}${i.have}/${i.need}</span>`).join('');
    const html = `${iconImg('chest', 'ico ord-chest')}<span class="ord-lvl">${v.level}</span><span class="ord-items">${items}</span>`;
    if (html !== this.orderKey) { this.orderKey = html; this.el.order.innerHTML = html; }
    this.setSefer();
  }

  // Haftanın düşmanı ve kalan süre
  setSefer() {
    const P = this.profile;
    if (!P) return;
    const b = P.boss();
    const pct = Math.round(P.weaponProgress() * 100);
    const html = P.campaign.won
      ? `${iconImg(b.icon)}<span>${L(`${b.name} yenildi`, `${b.name} defeated`)}</span><b>✓</b>`
      : `${iconImg(b.icon)}<span>${b.name}</span><b>${pctStr(pct)}</b><small>${duration(P.timeLeft())}</small>`;
    if (html !== this.seferKey) { this.seferKey = html; this.el.sefer.innerHTML = html; }
  }

  // ---------- görev şeridi ----------
  objective(text, i, n, label) {
    if (!text) { this.el.obj.hidden = true; return; }
    this.el.obj.hidden = false;
    if (this.el.objText.textContent !== text) {
      this.el.objText.textContent = text;
      this.el.objStep.textContent = label || `${i + 1}/${n}`;
      this.el.obj.classList.remove('pop');
      void this.el.obj.offsetWidth;
      this.el.obj.classList.add('pop');
    }
  }

  toast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    this.el.toasts.appendChild(t);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
    setTimeout(() => t.remove(), 2600);
  }

  // Güç arttı (sipariş, bekçi, sefer)
  powerGain(before) {
    const now = computePower(this.profile);
    if (now > before) this.toast(`+${fmtFull(now - before)} ${L('Güç', 'Power')}`);
  }

  // kilitlenince görünür: hangi malın atılacağını yazar ("Odunu at")
  setDump(types) {
    const on = types.length > 0;
    if (this.el.dump.hidden === on) this.el.dump.hidden = !on;
    if (!on) return;
    const label = types.length === 1 ? L(`${ITEMS[types[0]].name} at`, `Drop ${ITEMS[types[0]].name.toLocaleLowerCase(LOCALE)}`) : L('Fazlayı at', 'Drop extra');
    const html = `🗑${iconImg(types[0], 'ico dump-ico')}<span>${label}</span>`;
    if (this.dumpKey !== html) { this.dumpKey = html; this.el.dump.innerHTML = html; }
  }

  setUpgradeBadge(on) {
    if (this.el.badge.hidden === on) this.el.badge.hidden = !on;
  }

  // ---------- dünya üstü baloncuklar ----------
  bubble(obj, offsetY, cls) {
    const el = document.createElement('div');
    el.className = 'bubble ' + (cls || '');
    this.el.layer.appendChild(el);
    const b = {
      obj, offsetY, el, visible: true, html: '',
      set: (html) => { if (b.html !== html) { b.html = html; el.innerHTML = html; } },
      show: (v) => { if (b.visible !== v) { b.visible = v; el.hidden = !v; } },
      remove: () => { el.remove(); const i = this.bubbles.indexOf(b); if (i >= 0) this.bubbles.splice(i, 1); },
    };
    this.bubbles.push(b);
    return b;
  }

  floater(obj, text, cls) {
    const el = document.createElement('div');
    el.className = 'floater ' + (cls || '');
    el.innerHTML = cls === 'gold' || cls === 'sale' ? `${iconImg('coin')}${text}` : cls === 'order' ? `${iconImg('chest')}${text}` : text;
    this.el.layer.appendChild(el);
    const p = obj.getWorldPosition(new THREE.Vector3());
    p.y += 2.4;
    this.floaters.push({ el, p, t: 0 });
  }

  stationHTML(s) {
    const parts = s.needs().filter((x) => !x.fuel).map((x) => `<span class="need ${x.have >= x.n ? 'ok' : ''}">${iconImg(x.type)}${x.have}</span>`);
    const pct = Math.round(s.progress() * 100);
    const chance = s.recipe.chance != null ? `<small class="chance">${pctStr(s.recipe.chance * 100)}</small>` : '';
    let fuel = '';
    if (s.fuel) {
      // yakıt: kaç kömür kaldığı ve fırının ısısı
      const f = s.needs().find((x) => x.fuel);
      const heat = Math.round(s.heatLevel() * 100);
      fuel = `<div class="fuel ${f.have === 0 && heat === 0 ? 'cold' : ''}">🔥<span class="need ok">${iconImg(f.type)}${f.have}</span><div class="bar heat"><i style="width:${heat}%"></i></div></div>`;
    }
    return `<div class="rec">${parts.join('')}<span class="arrow">➜</span><span class="need out">${iconImg(s.recipe.out)}${s.output.total}</span>${chance}</div>${fuel}<div class="bar"><i style="width:${pct}%"></i></div>`;
  }

  project(world, w, h) {
    tmp.copy(world).project(this.camera);
    return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, behind: tmp.z > 1 };
  }

  update(dt) {
    this.monT = (this.monT || 0) - dt;
    if (this.monT <= 0) { this.monT = 0.5; this.updateMonetization(); }
    // altın sayacı yumuşak sayar
    if (this.shownGold !== this.gold) {
      const d = this.gold - this.shownGold;
      this.shownGold += Math.abs(d) < 2 ? d : Math.round(d * Math.min(1, dt * 12));
      this.el.gold.textContent = fmt(this.shownGold);
      if (d > 0) { this.el.goldBox.classList.remove('bump'); void this.el.goldBox.offsetWidth; this.el.goldBox.classList.add('bump'); }
    }
    const w = this.root.clientWidth, h = this.root.clientHeight;
    for (const b of this.bubbles) {
      if (!b.visible) continue;
      b.obj.getWorldPosition(tmp);
      tmp.y += b.offsetY * (b.obj.scale.y || 1);
      const s = this.project(tmp, w, h);
      b.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -100%)`;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      f.p.y += dt * 1.6;
      const s = this.project(f.p, w, h);
      f.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -50%) scale(${Math.min(1, f.t * 6)})`;
      f.el.style.opacity = String(Math.max(0, 1 - Math.max(0, f.t - 0.6) / 0.5));
      if (f.t > 1.1) { f.el.remove(); this.floaters.splice(i, 1); }
    }
  }

  // ---------- Lonca paneli ----------
  openPanel() {
    sfx.unlock();
    this.el.panel.hidden = false;
    this.el.pgVal.textContent = fmt(this.gold);
    this.refreshUpgrades();
  }

  closePanel() { this.el.panel.hidden = true; }

  refreshUpgrades() {
    if (this.el.panel.hidden || !this.game) return;
    const g = this.game;
    if (this.tab === 'army') { this.renderArmy(); return; }
    const list = g.upgrades.filter((u) => (this.tab === 'crew' ? u.crew : !u.crew));
    this.el.list.innerHTML = list.map((u) => {
      const lvl = g.levels[u.id];
      const locked = u.requires && !g.unlocked.has(u.requires);
      const maxed = lvl >= u.max;
      const cost = g.costOf(u);
      const btn = locked
        ? `<button class="buy" disabled>🔒 ${L('Kilitli', 'Locked')}</button>`
        : maxed
          ? `<button class="buy max" disabled>${L('MAKS', 'MAX')}</button>`
          : `<button class="buy" data-up="${u.id}" data-cost="${cost}">${cost === 0 ? L('BEDAVA', 'FREE') : iconImg('coin') + fmt(cost)}</button>`;
      const pips = `<div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
      const need = locked ? g.region.unlocks.find((x) => x.id === u.requires)?.name : '';
      const lockNote = locked ? `<small class="lock">${L(`${need} gerekir`, `Requires ${need}`)}</small>` : '';
      return `<div class="up-row ${locked ? 'locked' : ''}">
        <div class="up-ico">${iconImg(u.icon)}</div>
        <div class="up-mid"><b>${u.name}</b><small>${u.info(lvl)}</small>${pips}${lockNote}</div>
        ${btn}
      </div>`;
    }).join('');
    this.refreshAfford();
  }

  // ---------- ayarlar: hesap, takma ad, dil, ses, gizlilik, sıfırlama, hesap silme ----------
  setupSettings() {
    this.el.settings.querySelector('.set-close').addEventListener('click', () => this.closeSettings());
    this.el.settings.addEventListener('pointerdown', (e) => { if (e.target === this.el.settings) this.closeSettings(); });
    this.el.setList.addEventListener('click', (e) => {
      const b = e.target.closest('[data-set]');
      if (b) this.settingsAction(b);
    });
  }

  openSettings() {
    sfx.unlock();
    this.el.settings.hidden = false;
    this.renderSettings();
  }

  closeSettings() { this.el.settings.hidden = true; }

  renderSettings() {
    let account;
    if (!cloud.enabled) {
      account = `<p>${L('Oyun bu cihaza kaydedilir.', 'Your game is saved on this device.')}</p>`;
    } else if (cloud.state !== 'ok' && !cloud.user) {
      account = `<p>${L('Sunucuya bağlanılamadı. Oyun bu cihaza kaydediliyor; bağlantı gelince yedeklenecek.', 'Could not reach the server. Your game is saved on this device and will be backed up when you are online.')}</p>`;
    } else if (cloud.isGuest) {
      account = `<p class="warn">${L('Misafir hesap: ilerlemen buluta yedekleniyor ama oyunu silersen ya da telefon değiştirirsen geri alamazsın. Google hesabını bağla, krallığın güvende olsun.', 'Guest account: your progress is backed up, but if you uninstall or change phones you cannot get it back. Link your Google account to keep your kingdom safe.')}</p>
        ${cloud.canGoogle ? `<button class="go-btn google" data-set="google">${googleG()} ${L('Google ile bağla', 'Link Google account')}</button>`
          : `<p class="card-note">${L('Google bağlama Android uygulamasında kullanılabilir.', 'Google linking is available in the Android app.')}</p>`}`;
    } else {
      account = `<p>${googleG()} ${L('Google hesabı bağlı', 'Google account linked')}: <b>${esc(cloud.googleEmail || '')}</b></p>
        <p class="card-note">${L('İlerlemen buluta yedekleniyor. Yeni telefonda ya da yeniden kurduğunda “Google ile bağla” deyip krallığına dönebilirsin.', 'Your progress is backed up. On a new phone or after reinstalling, tap “Link Google account” to get your kingdom back.')}</p>`;
    }
    this.el.setList.innerHTML = `
      <div class="info-box">
        <b>${iconImg('user', 'ico inline')}${L('Hesap', 'Account')}</b>
        ${account}
        ${cloud.enabled && cloud.user ? `<div class="set-row"><span>${L('Takma ad', 'Nickname')}: <b>${esc(cloud.nickname || '—')}</b></span><button class="link-btn dark" data-set="nick">${cloud.nickname ? L('Değiştir', 'Change') : L('Seç', 'Pick')}</button></div>
        <small class="muted">${L('Oyuncu kimliği', 'Player ID')}: ${cloud.playerId}</small>` : ''}
      </div>
      <div class="info-box">
        <b>${iconImg('globe', 'ico inline')}${L('Dil', 'Language')}</b>
        <div class="card-row">
          <button class="go-btn ${LANG === 'tr' ? '' : 'alt'}" data-set="lang-tr">Türkçe</button>
          <button class="go-btn ${LANG === 'en' ? '' : 'alt'}" data-set="lang-en">English</button>
        </div>
      </div>
      <div class="info-box">
        <b>${sfx.on ? '🔊' : '🔇'}&nbsp;${L('Ses', 'Sound')}</b>
        <div class="card-row">
          <button class="go-btn ${sfx.on ? '' : 'alt'}" data-set="sound-on">${L('Açık', 'On')}</button>
          <button class="go-btn ${sfx.on ? 'alt' : ''}" data-set="sound-off">${L('Kapalı', 'Off')}</button>
        </div>
      </div>
      <div class="info-box">
        <b>${L('Gizlilik', 'Privacy')}</b>
        <div class="set-links">
          <a href="https://cagdasarslan.github.io/forge-master/privacy.html" target="_blank" rel="noopener">${L('Gizlilik politikası', 'Privacy policy')}</a>
          ${privacyOptionsAvailable() ? `<button class="link-btn dark" data-set="privacy">${L('Reklam gizlilik seçenekleri', 'Ad privacy options')}</button>` : ''}
        </div>
      </div>
      <button class="reset-btn" data-set="reset">${L('Bütün ilerlemeyi sıfırla', 'Reset all progress')}</button>
      ${cloud.enabled && cloud.user ? `<button class="reset-btn dark" data-set="delete">${L('Hesabımı ve verilerimi sil', 'Delete my account and data')}</button>` : ''}`;
  }

  async settingsAction(b) {
    const a = b.dataset.set;
    if (a === 'nick') this.askNickname();
    if (a === 'lang-tr' && LANG !== 'tr') this.switchLang();
    if (a === 'lang-en' && LANG !== 'en') this.switchLang();
    if (a === 'google') this.linkGoogle(b);
    if (a === 'sound-on' || a === 'sound-off') {
      sfx.setOn(a === 'sound-on');
      try { localStorage.setItem('forgemaster.sound', sfx.on ? '1' : '0'); } catch { /* yok say */ }
      sfx.pop?.(2);
      this.renderSettings();
    }
    if (a === 'privacy') showPrivacyOptions();
    if (a === 'reset') {
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = L('Bütün krallık silinir. Emin misin? Tekrar dokun', 'Your whole kingdom will be erased. Sure? Tap again'); return; }
      b.disabled = true;
      await cloud.wipeSave();
      this.profile.reset();
    }
    if (a === 'delete') {
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = L('Hesabın, kaydın ve sıralaman kalıcı olarak silinir. Tekrar dokun', 'Your account, save and ranking will be permanently deleted. Tap again'); return; }
      b.disabled = true;
      try {
        await cloud.deleteAccount();
        this.profile.reset();
      } catch (e) {
        console.warn('delete', e);
        b.disabled = false;
        this.toast(L('Silinemedi, internet bağlantını kontrol et', 'Could not delete, check your connection'));
      }
    }
  }

  async linkGoogle(btn) {
    btn.disabled = true;
    try {
      const r = await cloud.linkGoogle();
      if (r.linked) { sfx.unlock2(); this.toast(L('Google hesabı bağlandı', 'Google account linked')); }
      else if (r.existing) this.askSwitchAccount();
    } catch (e) {
      console.warn('google', e);
      if (!/cancel/i.test(String(e?.message || e))) this.toast(L('Google bağlanamadı, tekrar dene', 'Could not link Google, try again'));
    } finally {
      btn.disabled = false;
      if (!this.el.settings.hidden) this.renderSettings();
    }
  }

  // Bu Google hesabında zaten bir krallık var: ona geçilsin mi?
  askSwitchAccount() {
    this.modal(`<div class="modal-big">${iconImg('castle', 'ico huge')}</div>
      <h2>${L('Kayıtlı krallık bulundu', 'Saved kingdom found')}</h2>
      <p>${L('Bu Google hesabına bağlı bir krallık var. Ona geçersen bu cihazdaki misafir ilerlemesi kullanılmaz.', 'This Google account already has a kingdom. If you switch to it, the guest progress on this device will not be used.')}</p>
      <div class="card-row">
        <button class="go-btn alt" data-modal="close">${L('Vazgeç', 'Cancel')}</button>
        <button class="go-btn" data-modal="keep" data-switch="1">${L('Krallığıma geç', 'Switch to my kingdom')}</button>
      </div>`);
    const b = this.el.modalCard.querySelector('[data-switch]');
    b.addEventListener('click', async () => {
      b.disabled = true;
      try { await cloud.switchToGoogle(); this.closeModal(); } catch (e) {
        console.warn('switch', e);
        b.disabled = false;
        this.toast(L('Geçilemedi, tekrar dene', 'Could not switch, try again'));
      }
    });
  }

  // Başka cihazda daha yeni ilerleme var: hangisi kullanılsın?
  askConflict(remote) {
    return new Promise((resolve) => {
      this.modal(`<h2>${L('Başka bir cihazda ilerleme var', 'Progress found on another device')}</h2>
        <p>${L('Bu hesapta başka bir cihazda kaydedilmiş daha yeni bir ilerleme var.', 'This account has newer progress saved on another device.')}</p>
        <p>${L('Bulut', 'Cloud')}: ${iconImg('power')}<b>${fmtFull(remote.power || 0)}</b> · ${L('Bu cihaz', 'This device')}: ${iconImg('power')}<b>${fmtFull(computePower(this.profile))}</b></p>
        <div class="card-row">
          <button class="go-btn alt" data-modal="keep" data-pick="local">${L('Bu cihazdakini kullan', 'Keep this device')}</button>
          <button class="go-btn" data-modal="keep" data-pick="remote">${L('Buluttakini yükle', 'Load cloud save')}</button>
        </div>`);
      this.el.modal.dataset.locked = '1';
      for (const b of this.el.modalCard.querySelectorAll('[data-pick]')) {
        b.addEventListener('click', () => { delete this.el.modal.dataset.locked; this.closeModal(); resolve(b.dataset.pick); });
      }
    });
  }

  // ---------- ordu ve bölge bekçisi ----------
  openArmy() {
    this.tab = 'army';
    for (const o of this.el.panel.querySelectorAll('.panel-tabs button')) o.classList.toggle('on', o.dataset.tab === 'army');
    this.openPanel();
  }

  renderArmy() {
    const g = this.game;
    const gd = g.region.guardian;
    const dps = g.armyDps();
    const dmg30 = dps * FIGHT_TIME;
    const k = Math.min(1, dmg30 / gd.hp);
    const tries = g.guardianTriesLeft();
    const attack = L('SALDIR', 'ATTACK');
    let status, btn;
    if (g.rs.guardianDefeated) {
      status = `<span class="gd-done">${L('Yenildi ✓ Yol açık', 'Defeated ✓ Road open')}</span>`;
      btn = '';
    } else if (!g.guardianReady()) {
      status = `<span>${L(`Saldırmak için ${REGION_UNLOCK_LEVEL}. siparişi bitir`, `Finish order ${REGION_UNLOCK_LEVEL} to attack`)} (${g.rs.level}/${REGION_UNLOCK_LEVEL})</span>`;
      btn = `<button class="go-btn" disabled>⚔ ${attack}</button>`;
    } else if (!g.figuresReady()) {
      status = `<span>${L('Önce en az bir asker türü aç', 'Unlock at least one soldier type first')}</span>`;
      btn = `<button class="go-btn" disabled>⚔ ${attack}</button>`;
    } else {
      status = `<span>${L('Bugün kalan saldırı hakkı', 'Attacks left today')}: <b>${tries}/3</b> · ${L(`Her saldırı ${FIGHT_TIME} sn`, `Each attack ${FIGHT_TIME} s`)}</span>`;
      btn = `<button class="go-btn ${g.canWin() ? 'ready' : ''}" data-act="attack" ${tries > 0 && !g.fighting ? '' : 'disabled'}>⚔ ${g.fighting ? L('SAVAŞ SÜRÜYOR', 'BATTLE ON') : attack}</button>`;
    }
    const units = g.region.army.map((u) => {
      const lvl = g.armyCount(u.id);
      const locked = u.requires && !g.unlocked.has(u.requires);
      const cost = g.armyCost(u);
      const need = locked ? g.region.unlocks.find((x) => x.id === u.requires)?.name : '';
      const b = locked ? `<button class="buy" disabled>🔒 ${L('Kilitli', 'Locked')}</button>`
        : !g.canRecruit(u) ? `<button class="buy max" disabled>${L('MAKS', 'MAX')}</button>`
          : `<button class="buy" data-recruit="${u.id}" data-cost="${cost}">${lvl ? '' : L('AÇ ', 'GET ')}${iconImg('coin')}${fmt(cost)}</button>`;
      const figs = lvl ? Math.min(3, 1 + Math.floor(lvl / 10)) : 0;
      const info = lvl
        ? L(`Saniyede ${fmt(lvl * u.dps)} hasar · ${figs} asker`, `${fmt(lvl * u.dps)} damage/s · ${figs} soldier${figs > 1 ? 's' : ''}`)
        : L(`Seviye başına saniyede ${fmt(u.dps)} hasar`, `${fmt(u.dps)} damage/s per level`);
      return `<div class="up-row ${locked ? 'locked' : ''}">
        <div class="up-ico">${iconImg(u.icon)}</div>
        <div class="up-mid"><b>${u.name} <i class="cnt">${L('Sv.', 'Lv.')}${lvl}</i></b><small>${info}</small>${locked ? `<small class="lock">${L(`${need} gerekir`, `Requires ${need}`)}</small>` : ''}</div>
        ${b}
      </div>`;
    }).join('');
    this.el.list.innerHTML = `
      <div class="guardian">
        <div class="gd-head">${iconImg(gd.icon, 'ico gd-ico')}<div><b>${gd.name}</b><small>${L('Bölge bekçisi', 'Region guardian')} · ${L('Can', 'HP')} ${fmt(gd.hp)}</small></div></div>
        <p class="gd-story">${gd.story}</p>
        <div class="gd-bar"><i style="width:${Math.round(k * 100)}%"></i><span>${iconImg('army')}${L(`${FIGHT_TIME} sn'de`, `In ${FIGHT_TIME} s:`)} ${fmt(dmg30)} / ${fmt(gd.hp)} ${L('hasar', 'damage')}</span></div>
        <div class="gd-status">${status}</div>
        ${btn}
      </div>
      <p class="card-note">${L('Asker türünü açınca arenada yerini alır; her seviye vuruşunu artırır. Her 10 seviyede bir asker daha katılır.', 'Unlocked soldiers take their place in the arena; every level makes them hit harder. One more soldier joins every 10 levels.')}</p>
      ${units}`;
    this.refreshAfford();
  }

  attackGuardian() {
    if (!this.game.attackGuardian()) return;
    this.closePanel();
    this.toast(L(`Saldırı! ${FIGHT_TIME} saniyen var`, `Attack! You have ${FIGHT_TIME} seconds`));
  }

  guardianResult(r) {
    const g = this.game;
    const gd = g.region.guardian;
    const next = REGIONS[regionIndex(g.region.id) + 1];
    if (r.won) {
      this.modal(`<div class="modal-big">${iconImg(gd.icon, 'ico huge')}</div>
        <h2>${L(`${gd.name} yenildi!`, `${gd.name} defeated!`)}</h2>
        <p>${next ? `${L('Yol açıldı', 'Road open')}: <b>${next.name}</b>` : L('Ejderha Dağı tamamen fethedildi!', 'Dragon Mountain is fully conquered!')}</p>
        <p class="seal-gain">${iconImg('seal')} +${r.seals} ${L('Mühür', 'Seals')} · ${iconImg('coin')} +${fmt(r.gold)}${r.power ? ` · ${iconImg('power')} +${fmtFull(r.power)}` : ''}</p>
        <div class="card-row"><button class="go-btn alt" data-modal="close">${L('Devam et', 'Continue')}</button>${next ? `<button class="go-btn" data-modal="map">${L('Haritayı aç', 'Open map')}</button>` : ''}</div>`);
    } else {
      this.modal(`<div class="modal-big">${iconImg(gd.icon, 'ico huge')}</div>
        <h2>${L('Ordu geri çekildi', 'The army retreated')}</h2>
        <p>${L(`${gd.name}'in canı ${FIGHT_TIME} saniyede bitmedi`, `${gd.name} survived ${FIGHT_TIME} seconds`)}: <b>${fmt(r.hpLeft)}</b> ${L('can kaldı ve canavar iyileşti.', 'HP left and the monster healed.')}</p>
        <p>${L(`Ordunun saniyede vuruşu ${fmt(r.dps)}, gereken en az ${fmt(Math.ceil(r.hp / FIGHT_TIME))}. Askerlerinin seviyesini yükselt.`, `Your army deals ${fmt(r.dps)} damage/s, at least ${fmt(Math.ceil(r.hp / FIGHT_TIME))} is needed. Level up your soldiers.`)}</p>
        <p>${L('Bugün kalan saldırı hakkı', 'Attacks left today')}: <b>${r.triesLeft}/3</b></p>
        <button class="go-btn" data-modal="close">${L('Tamam', 'OK')}</button>`);
    }
  }

  refreshAfford() {
    for (const b of this.el.list.querySelectorAll('button[data-cost]')) b.classList.toggle('cant', Number(b.dataset.cost) > this.gold);
  }

  // ---------- Krallık Haritası ----------
  openMap(select) {
    sfx.unlock();
    this.closePanel();
    this.el.map.hidden = false;
    this.el.mapClose.hidden = !this.game;
    this.renderMap();
    this.selectNode(select || this.game?.region.id || this.profile.current);
  }

  closeMap() { if (this.game) this.el.map.hidden = true; }

  renderMap() {
    const P = this.profile;
    this.el.sealVal.textContent = P.data.seals;
    // krallık tek kara parçası; her bölge kendi renginde bir toprak
    const TERR = { village: '#9fd06a', valley: '#d9b26a', castle: '#aaa49a', river: '#7fcfd8', caves: '#9a8ac8', dragon: '#d0805a' };
    let svg = `<path class="land" d="M8 70 C4 50 8 22 22 12 C36 4 58 2 74 8 C90 14 97 34 94 54 C92 74 84 92 64 95 C44 98 26 96 14 88 C9 84 9 78 8 70 Z" />`;
    for (const r of REGIONS) {
      const open = P.isOpen(r.id);
      svg += `<ellipse class="terr ${open ? 'open' : ''}" cx="${r.map.x}" cy="${r.map.y}" rx="17" ry="13" fill="${TERR[r.id]}" />`;
    }
    svg += `<circle class="terr capital" cx="${CAPITAL.map.x}" cy="${CAPITAL.map.y}" r="10" fill="#f2d48a" />`;
    for (let i = 0; i < REGIONS.length - 1; i++) {
      const a = REGIONS[i].map, b = REGIONS[i + 1].map;
      const open = P.isOpen(REGIONS[i + 1].id);
      const mx = (a.x + b.x) / 2 + (i % 2 ? 6 : -6), my = (a.y + b.y) / 2;
      svg += `<path d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" class="road ${open ? 'open' : ''}" />`;
    }
    for (const r of REGIONS) {
      if (P.level(r.id) < 1) continue;
      svg += `<line x1="${r.map.x}" y1="${r.map.y}" x2="${CAPITAL.map.x}" y2="${CAPITAL.map.y}" class="caravan" />`;
    }
    this.el.mapPaths.innerHTML = svg;
    if (!this.el.mapDeco.childElementCount) {
      const deco = [['▲', 84, 30], ['▲', 88, 26], ['▲', 64, 8], ['▲', 80, 10], ['♣', 8, 62], ['♣', 12, 68], ['♣', 40, 88], ['♣', 44, 92], ['≈', 34, 62], ['≈', 26, 48], ['♣', 90, 70], ['▲', 10, 14]];
      this.el.mapDeco.innerHTML = deco.map(([c, x, y]) => `<span style="left:${x}%;top:${y}%">${c}</span>`).join('');
    }
    const cur = this.game?.region.id;
    const nodes = REGIONS.map((r, i) => {
      const open = P.isOpen(r.id);
      const lvl = P.level(r.id);
      return `<button class="node ${open ? 'open' : 'locked'} ${r.id === cur ? 'here' : ''}" data-node="${r.id}" style="left:${r.map.x}%;top:${r.map.y}%">
        <span class="node-ico">${iconImg(r.icon)}${open ? '' : '<em class="lock">🔒</em>'}</span>
        <span class="node-name">${i + 1}. ${r.name}</span>
        <span class="node-stars">${open ? `${L('Sv.', 'Lv.')} ${lvl}` : L('Kilitli', 'Locked')}</span>
      </button>`;
    });
    const b = P.boss();
    nodes.push(`<button class="node capital" data-node="capital" style="left:${CAPITAL.map.x}%;top:${CAPITAL.map.y}%">
      <span class="node-ico">${iconImg('castle')}</span>
      <span class="node-name">${CAPITAL.name}</span>
      <span class="node-stars">${P.campaign.won ? L('Zafer ✓', 'Victory ✓') : `${b.weapon} ${pctStr(P.weaponProgress() * 100)}`}</span>
    </button>`);
    this.el.mapNodes.innerHTML = nodes.join('');
  }

  selectNode(id) {
    for (const n of this.el.mapNodes.querySelectorAll('.node')) n.classList.toggle('sel', n.dataset.node === id);
    let html = '';
    if (id === 'capital') html = this.capitalCard();
    else if (id === 'seals') html = this.sealsCard();
    else if (id === 'ambar') html = this.ambarCard();
    else html = this.regionCard(id);
    this.el.mapCard.innerHTML = html;
  }

  regionCard(id) {
    const P = this.profile;
    const r = REGIONS.find((x) => x.id === id);
    const idx = regionIndex(id);
    const open = P.isOpen(id);
    const lvl = P.level(id);
    const here = this.game?.region.id === id;
    const order = P.orderFor(r, lvl);
    const items = Object.entries(order).map(([t, n]) => `<span>${iconImg(t)}${n}</span>`).join('');
    const rate = exportRate(P.workersIn(r), P.meta('passive'));
    const good = ITEMS[r.exports].name.toLocaleLowerCase(LOCALE);
    const flow = lvl >= 1
      ? L(`Kervanlar Ambar'a dakikada <b>${rate.toFixed(1)}</b> ${good} götürüyor`, `Caravans carry <b>${rate.toFixed(1)}</b> ${good} per minute to the Storehouse`)
      : L(`İlk sipariş bitince ${good} kervanı başlar`, `The ${good} caravan starts after the first order`);
    const imp = r.depot ? `<p class="card-flow">${iconImg(r.depot.type)}${L('Kervanla gelir', 'Arrives by caravan')}: <b>${ITEMS[r.depot.type].name}</b></p>` : '';
    const prev = REGIONS[idx - 1];
    const btn = here
      ? `<button class="go-btn here" disabled>${L('Buradasın', 'You are here')}</button>`
      : open
        ? `<button class="go-btn" data-go="${id}">${P.data.regions[id]?.visited ? L('GİT', 'GO') : L('YOLA ÇIK', 'SET OFF')}</button>`
        : P.level(prev.id) < REGION_UNLOCK_LEVEL
          ? `<button class="go-btn" disabled>🔒 ${prev.name}: ${L(`${REGION_UNLOCK_LEVEL}. sipariş gerekir`, `order ${REGION_UNLOCK_LEVEL} required`)} (${P.level(prev.id)}/${REGION_UNLOCK_LEVEL})</button>`
          : `<button class="go-btn" disabled>🔒 ${prev.name}: ${L(`${prev.guardian.name} yenilmeli`, `defeat ${prev.guardian.name}`)}</button>`;
    return `<div class="card-head">${iconImg(r.icon, 'ico card-ico')}<div><b>${r.name}</b><span class="card-sub">${L('Sipariş seviyesi', 'Order level')} ${lvl}</span></div></div>
      <p class="card-intro">${r.intro}</p>
      <div class="card-order"><small>${L(`Sıradaki sipariş (${orderSeals(lvl)} mühür)`, `Next order (${orderSeals(lvl)} seals)`)}</small><div class="sold">${items}</div></div>
      <p class="card-flow">${iconImg(r.exports)}${flow}</p>${imp}
      ${btn}`;
  }

  capitalCard() {
    const P = this.profile;
    const b = P.boss();
    const c = P.campaign;
    const rows = b.parts.map((p) => {
      const k = P.partProgress(p);
      const mats = Object.entries(p.needs).map(([t, n]) => `<span title="${ITEMS[t].name}">${iconImg(t)}${P.given(p.id, t)}/${n}</span>`).join('');
      const canGive = k < 1 && Object.keys(p.needs).some((t) => P.ambar(t) > 0 && P.given(p.id, t) < p.needs[t]);
      return `<div class="part"><b>${p.name}</b><div class="part-mats">${mats}</div>
        <button class="give" data-part="${p.id}" ${canGive ? '' : 'disabled'}>${k >= 1 ? '✓' : L('Gönder', 'Send')}</button>
        <div class="bar big"><i style="width:${Math.round(k * 100)}%"></i></div></div>`;
    }).join('');
    const trophies = P.trophies().map((id) => { const x = BOSSES.find((bb) => bb.id === id); return `<span title="${x.name}">${iconImg(x.icon)}</span>`; }).join('');
    let action;
    if (c.won) {
      const bn = P.bounty();
      const ok = P.ambar(bn.type) >= bn.amount;
      const good = ITEMS[bn.type].name.toLocaleLowerCase(LOCALE);
      action = `<div class="bounty"><b>${L('Kraliyet Görevi', 'Royal Task')} #${c.bountyN + 1}</b>
        <span>${iconImg(bn.type)} ${L(`${bn.amount} ${good} gönder`, `Send ${bn.amount} ${good}`)} (${L('Ambar', 'Storehouse')}: ${P.ambar(bn.type)})</span>
        <button class="go-btn" data-act="bounty" ${ok ? '' : 'disabled'}>${iconImg('seal')} +${bn.seals} ${L('Mühür', 'Seals')}</button></div>
        <p class="card-note">${L(`Yeni düşman ${duration(P.timeLeft())} sonra geliyor.`, `A new enemy arrives in ${duration(P.timeLeft())}.`)}</p>`;
    } else {
      action = `<div class="card-row">
          <button class="go-btn alt" data-part="all">${L("Ambar'dan hepsini gönder", 'Send all from Storehouse')}</button>
          <button class="go-btn" data-act="battle" ${P.weaponReady() ? '' : 'disabled'}>⚔ ${L('SEFERE ÇIK', 'MARCH OUT')}</button>
        </div>`;
    }
    return `<div class="card-head">${iconImg(b.icon, 'ico card-ico')}<div><b>${L(`${b.week + 1}. Hafta`, `Week ${b.week + 1}`)}: ${b.name}</b><span class="card-sub">${c.won ? L('Yenildi!', 'Defeated!') : `${L('Kalan süre', 'Time left')} ${duration(P.timeLeft())}`} · ${b.weapon}</span></div></div>
      <p class="card-intro">${b.story}</p>
      <div class="parts">${rows}</div>
      ${action}
      <div class="card-row">
        <button class="go-btn alt" data-act="ambar">${iconImg('chest')} ${L('Ambar', 'Storehouse')}</button>
        <button class="go-btn alt" data-act="seals">${iconImg('seal')} ${L('Mühürler', 'Seals')}</button>
      </div>
      ${trophies ? `<div class="trophies"><small>${L(`Ganimet salonu (satışlar +%${Math.round(P.trophies().length * TROPHY_BONUS * 100)})`, `Trophy hall (sales +${Math.round(P.trophies().length * TROPHY_BONUS * 100)}%)`)}</small><div>${trophies}</div></div>` : ''}`;
  }

  ambarCard() {
    const P = this.profile;
    const mats = ['ingot', 'bronze', 'steel', 'goldleaf', 'crystal', 'dragonfire'];
    const rows = mats.map((t) => `<span>${iconImg(t)}${fmt(P.ambar(t))}</span>`).join('');
    return `<div class="card-head">${iconImg('chest', 'ico card-ico')}<div><b>${L('Krallık Ambarı', 'Royal Storehouse')}</b><span class="card-sub">${L("Bölgelerin Kraliyet Sandığı'na koyduğun ve kervanların getirdiği mallar", "Goods you put in the regions' Royal Chests and goods brought by caravans")}</span></div></div>
      <div class="sold big">${rows}</div>
      <p class="card-note">${L('Ambar hem haftalık silahı hem de bölgelerin kervan duraklarını besler: vadideki miğferci demiri, kaledeki su çekici bronzu buradan alır.', "The Storehouse feeds both the weekly weapon and the regions' caravan stops: the valley's helmsmith takes iron from here, the castle's trip hammer takes bronze.")}</p>
      <button class="go-btn alt" data-act="capital">← ${L('Sefer', 'Campaign')}</button>`;
  }

  sealsCard() {
    const P = this.profile;
    const rows = META.map((m) => {
      const l = P.meta(m.id);
      const maxed = l >= m.max;
      const cost = maxed ? 0 : m.cost(l);
      return `<div class="up-row">
        <div class="up-ico">${iconImg(m.icon)}</div>
        <div class="up-mid"><b>${m.name}</b><small>${m.info(maxed ? l : l + 1)}</small><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>
        ${maxed ? `<button class="buy max" disabled>${L('MAKS', 'MAX')}</button>` : `<button class="buy ${P.data.seals < cost ? 'cant' : ''}" data-meta="${m.id}">${iconImg('seal')}${cost}</button>`}
      </div>`;
    }).join('');
    return `<div class="card-head">${iconImg('seal', 'ico card-ico')}<div><b>${L('Krallık Mühürleri', 'Royal Seals')}</b><span class="card-sub">${L('Siparişler, seferler ve görevler mühür verir. Bonuslar bütün bölgelerde geçerli.', 'Orders, campaigns and tasks give seals. Bonuses apply in every region.')}</span></div></div>
      <div class="seal-list">${rows}</div>
      <button class="go-btn alt" data-act="capital">← ${L('Sefer', 'Campaign')}</button>`;
  }

  travel(id) {
    if (this.game?.region.id === id) { this.closeMap(); return; }
    sfx.buy();
    this.el.fade.hidden = false;
    setTimeout(() => this.onTravel?.(id), 250);
  }

  // ---------- sefer ve zafer sahnesi ----------
  startBattle() {
    const P = this.profile;
    if (!P.weaponReady() || P.campaign.won) return;
    const b = P.boss();
    const before = computePower(P);
    const seals = P.winBoss();
    this.closeMap();
    this.playBattle(b, seals, computePower(P) - before);
    cloud.sync(true);
  }

  playBattle(b, seals, power) {
    const el = document.createElement('div');
    el.id = 'finale';
    this.root.appendChild(el);
    const scene = (html, cls = '') => { el.className = cls; el.innerHTML = `<div class="fin-stage">${html}</div>`; };
    const steps = [
      [0, () => scene(`${iconImg('castle', 'ico fin-ico')}<p>${L("Altı bölgenin malzemesi Kraliyet Örsü'nde birleşti...", "The materials of six regions came together on the Royal Anvil...")}</p>`)],
      [2200, () => scene(`<div class="fin-anvil">${iconImg('hammer', 'ico fin-ico hammer')}</div><p>${L(`Ustalar ${b.weapon} için çekiçlerini kaldırdı.`, `The smiths raised their hammers for the ${b.weapon}.`)}</p>`, 'forging')],
      [2600, () => { sfx.clang(); el.classList.add('flash'); }],
      [3300, () => { sfx.clang(); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }],
      [4000, () => { sfx.clang(); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }],
      [4800, () => { sfx.unlock2(); scene(`<div class="fin-sword">${iconImg(b.weaponIcon, 'ico fin-ico big')}</div><h2>${b.weapon}</h2><p>${L('Krallığın bütün bölgeleri bu silahta birleşti.', "Every region of the kingdom is united in this weapon.")}</p>`, 'reveal'); }],
      [8500, () => scene(`<div class="fin-dragon">${iconImg(b.icon, 'ico fin-ico big')}</div><p>${L(`Kral orduyla ${b.name} üzerine yürüdü...`, `The King marched with his army against the ${b.name}...`)}</p>`, 'battle')],
      [11000, () => { sfx.deny(); el.classList.add('strike'); }],
      [12100, () => {
        sfx.unlock2();
        scene(`<div class="fin-stars">★ ★ ★</div><h2>${L(`${b.name} yenildi!`, `${b.name} defeated!`)}</h2>
          <p>${L('Ganimet salonuna yeni bir hatıra kondu: bütün satışlar kalıcı olarak <b>+%3</b>.', 'A new trophy joins the hall: all sales permanently <b>+3%</b>.')} <b>+${seals} ${L('Mühür', 'Seals')}</b>${power ? ` · <b>+${fmtFull(power)} ${L('Güç', 'Power')}</b>` : ''}</p>
          <div class="fin-ng"><b>${L('Krallık durmuyor', 'The kingdom never rests')}</b><span>${L(`Haftanın kalanında Kraliyet Görevleri mühür verir. Yeni düşman ${duration(this.profile.timeLeft())} sonra geliyor; bölgelerini büyütmeye devam et.`, `For the rest of the week Royal Tasks give seals. A new enemy arrives in ${duration(this.profile.timeLeft())}; keep growing your regions.`)}</span></div>
          <button class="go-btn" data-fin="close">${L('Krallığa dön', 'Back to the kingdom')}</button>`, 'victory');
      }],
    ];
    const timers = steps.map(([t, f]) => setTimeout(f, t));
    el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-fin]')) return;
      timers.forEach(clearTimeout);
      el.remove();
      this.setSefer();
    });
  }

  // ---------- açılır pencereler ----------
  modal(html) {
    this.el.modalCard.innerHTML = html;
    this.el.modal.hidden = false;
  }

  closeModal() { this.el.modal.hidden = true; }

  orderPopup(region, level, seals, gold, power) {
    const idx = regionIndex(region.id);
    const next = REGIONS[idx + 1];
    const unlock = level === REGION_UNLOCK_LEVEL && next
      ? `<p class="unlock">${L(`${next.name} yolunu <b>${region.guardian.name}</b> tutuyor. Lonca → Ordu'dan asker toplayıp onu yen!`, `<b>${region.guardian.name}</b> blocks the road to ${next.name}. Recruit soldiers in Guild → Army and defeat it!`)}</p>` : '';
    const good = ITEMS[region.exports].name.toLocaleLowerCase(LOCALE);
    const caravan = level === 1 ? `<p>${L(`Kervanlar artık ${good} malını Krallık Ambarı'na taşıyor.`, `Caravans now carry ${good} to the Royal Storehouse.`)}</p>` : '';
    this.modal(`<div class="modal-stars"><i class="on">★</i></div>
      <h2>${L(`Sipariş ${level} tamam!`, `Order ${level} complete!`)}</h2>
      <p>${L(`${region.name} Kral'ın siparişini teslim etti.`, `${region.name} delivered the King's order.`)}</p>
      ${caravan}${unlock}
      <p class="seal-gain">${iconImg('seal')} +${seals} ${L('Mühür', 'Seals')} · ${iconImg('coin')} +${fmt(gold)}${power ? ` · ${iconImg('power')} +${fmtFull(power)}` : ''}</p>
      <div class="card-row">
        <button class="go-btn alt" data-modal="close">${L('Devam et', 'Continue')}</button>
        <button class="go-btn" data-modal="map">${L('Haritayı aç', 'Open map')}</button>
      </div>`);
  }

  weekPopup(rolled) {
    const last = rolled[rolled.length - 1];
    const b = this.profile.boss();
    this.modal(`<div class="modal-big">${iconImg(b.icon, 'ico huge')}</div>
      <h2>${L(`${b.week + 1}. Hafta`, `Week ${b.week + 1}`)}: ${b.name}</h2>
      <p>${last.won ? L(`${last.name} yenilmişti.`, `${last.name} was defeated.`) : L(`${last.name} kaçtı (silah %${Math.round(last.progress * 100)}). Ambar'daki malzemen korunuyor.`, `${last.name} escaped (weapon ${Math.round(last.progress * 100)}%). Your Storehouse goods are kept.`)}</p>
      <p>${b.story}</p>
      <button class="go-btn" data-modal="map">${L('Seferi aç', 'Open campaign')}</button>`);
  }

  offlinePopup(info) {
    const list = Object.entries(info.gained).map(([t, n]) => `<span>${iconImg(t)}+${n}</span>`).join('');
    if (!list) return;
    const h = Math.floor(info.sec / 3600), m = Math.floor((info.sec % 3600) / 60);
    const away = `${h ? h + L(' sa ', ' h ') : ''}${m} ${L('dk', 'min')}`;
    this.modal(`<h2>${L('Kervanlar yolda', 'Caravans on the road')}</h2>
      <p>${L(`Sen yokken (${away}) bölgelerin Krallık Ambarı'na gönderdi:`, `While you were away (${away}) your regions sent to the Royal Storehouse:`)}</p>
      <div class="sold big">${list}</div>
      <button class="go-btn" data-modal="close">${L('Topla', 'Collect')}</button>`);
  }
}

function duration(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  const [D, H, M] = IS_EN ? ['d', 'h', 'm'] : ['g', 's', 'dk'];
  return d ? `${d}${D} ${h}${H}` : h ? `${h}${H} ${m % 60}${M}` : `${m % 60}${M}`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function googleG() {
  return '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
}

export function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// büyük sayıyı basamak ayraçlı yazar (12.345 / 12,345)
export function fmtFull(n) {
  return Math.floor(n).toLocaleString(LOCALE);
}

// yüzde: Türkçede %40, İngilizcede 40%
export function pctStr(n) {
  const v = Math.round(n);
  return IS_EN ? `${v}%` : `%${v}`;
}
