// HUD: altın, sipariş, görev şeridi, dünya üstü baloncuklar, Lonca paneli,
// Krallık Haritası (bölgeler, başkent, mühürler) ve açılır pencereler.
import * as THREE from 'three';
import { ITEMS, META, exportRate, REGION_UNLOCK_LEVEL, orderSeals, TROPHY_BONUS } from './config.js';
import { REGIONS, CAPITAL, regionIndex } from './regions/index.js';
import { BOSSES } from './bosses.js';
import { iconImg } from './icons.js';
import { sfx } from './audio.js';

const tmp = new THREE.Vector3();

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
            <button id="order" aria-label="Kraliyet Siparişi"></button>
            <button id="sefer" aria-label="Haftanın seferi"></button>
          </div>
          <div class="top-right">
            <button id="btn-map" class="round-btn map-btn" aria-label="Harita">${iconImg('map')}</button>
            <button id="btn-sound" class="round-btn" aria-label="Ses">🔊</button>
          </div>
        </div>
        <div id="objective" hidden><span class="obj-step"></span><span class="obj-text"></span></div>
        <div id="toasts"></div>
        <div id="world-layer"></div>
        <button id="btn-upgrade">${iconImg('hammer')}<span>GELİŞTİR</span><i class="badge" hidden>!</i></button>
      </div>
      <div id="joy" hidden><div class="joy-knob"></div></div>
      <div id="panel" class="sheet" hidden>
        <div class="panel-card">
          <div class="panel-head">
            <div class="panel-title">LONCA</div>
            <div class="panel-gold">${iconImg('coin')}<span class="pg-val">0</span></div>
            <button class="panel-close" aria-label="Kapat">✕</button>
          </div>
          <div class="panel-tabs">
            <button data-tab="smith" class="on">Usta</button>
            <button data-tab="crew">İşçiler</button>
            <button data-tab="more">Ayarlar</button>
          </div>
          <div class="panel-list"></div>
        </div>
      </div>
      <div id="map" hidden>
        <div class="map-head">
          <div class="map-title">Krallık Haritası</div>
          <div class="map-seals">${iconImg('seal')}<span class="seal-val">0</span></div>
          <button class="panel-close map-close" aria-label="Kapat">✕</button>
        </div>
        <div class="map-board">
          <svg class="map-paths" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
          <div class="map-deco"></div>
          <div class="map-nodes"></div>
        </div>
        <div class="map-card"></div>
      </div>
      <div id="modal" hidden><div class="modal-card"></div></div>
      <div id="fade" hidden></div>
    `);
    const q = (s) => root.querySelector(s);
    this.el = {
      gold: q('#gold-val'), goldBox: q('#gold'), order: q('#order'), sefer: q('#sefer'),
      obj: q('#objective'), objText: q('.obj-text'), objStep: q('.obj-step'),
      toasts: q('#toasts'), layer: q('#world-layer'),
      upBtn: q('#btn-upgrade'), badge: q('#btn-upgrade .badge'),
      panel: q('#panel'), list: q('.panel-list'), pgVal: q('.pg-val'),
      sound: q('#btn-sound'), joy: q('#joy'),
      map: q('#map'), mapPaths: q('.map-paths'), mapNodes: q('.map-nodes'), mapDeco: q('.map-deco'), mapCard: q('.map-card'),
      sealVal: q('.seal-val'), mapClose: q('.map-close'),
      modal: q('#modal'), modalCard: q('.modal-card'), fade: q('#fade'),
    };
    this.tab = 'smith';
    this.el.upBtn.addEventListener('click', () => this.openPanel());
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
      const r = e.target.closest('[data-act=reset]');
      if (r) {
        if (r.dataset.armed) this.profile.reset();
        else { r.dataset.armed = '1'; r.textContent = 'Bütün krallık silinir. Emin misin? Tekrar dokun'; }
      }
    });
    this.el.sound.addEventListener('click', () => {
      sfx.setOn(!sfx.on);
      this.el.sound.textContent = sfx.on ? '🔊' : '🔇';
      try { localStorage.setItem('forgemaster.sound', sfx.on ? '1' : '0'); } catch { /* yok say */ }
    });
    try {
      if (localStorage.getItem('forgemaster.sound') === '0') { sfx.setOn(false); this.el.sound.textContent = '🔇'; }
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
        if (got) { sfx.unlock2(); this.toast(`+${got} Mühür`); } else sfx.deny();
        this.renderMap();
        this.selectNode('capital');
      }
    });
    this.el.modal.addEventListener('click', (e) => {
      const b = e.target.closest('[data-modal]');
      if (!b) return;
      this.closeModal();
      if (b.dataset.modal === 'map') this.openMap();
    });
  }

  icon(name) { return iconImg(name); }

  get panelOpen() { return !this.el.panel.hidden || !this.el.map.hidden || !this.el.modal.hidden; }

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
      ? `${iconImg(b.icon)}<span>${b.name} yenildi</span><b>✓</b>`
      : `${iconImg(b.icon)}<span>${b.name}</span><b>%${pct}</b><small>${duration(P.timeLeft())}</small>`;
    if (html !== this.seferKey) { this.seferKey = html; this.el.sefer.innerHTML = html; }
  }

  // ---------- görev şeridi ----------
  objective(text, i, n) {
    if (!text) { this.el.obj.hidden = true; return; }
    this.el.obj.hidden = false;
    if (this.el.objText.textContent !== text) {
      this.el.objText.textContent = text;
      this.el.objStep.textContent = `${i + 1}/${n}`;
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
    const chance = s.recipe.chance != null ? `<small class="chance">%${Math.round(s.recipe.chance * 100)}</small>` : '';
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
    if (this.tab === 'more') {
      const sold = Object.keys(ITEMS).filter((t) => g.stats['sold_' + t]).map((t) => `<span>${iconImg(t)}${g.stats['sold_' + t]}</span>`).join('') || '<span>Henüz satış yok</span>';
      this.el.list.innerHTML = `
        <div class="info-box">
          <b>Bu oturumda satılan</b>
          <div class="sold">${sold}</div>
          <p>Oyun her birkaç saniyede bir bu cihaza kaydedilir.</p>
        </div>
        <button class="reset-btn" data-act="reset">Bütün ilerlemeyi sıfırla</button>`;
      return;
    }
    const list = g.upgrades.filter((u) => (this.tab === 'crew' ? u.crew : !u.crew));
    this.el.list.innerHTML = list.map((u) => {
      const lvl = g.levels[u.id];
      const locked = u.requires && !g.unlocked.has(u.requires);
      const maxed = lvl >= u.max;
      const cost = g.costOf(u);
      const btn = locked
        ? `<button class="buy" disabled>🔒 Kilitli</button>`
        : maxed
          ? `<button class="buy max" disabled>MAKS</button>`
          : `<button class="buy" data-up="${u.id}" data-cost="${cost}">${cost === 0 ? 'BEDAVA' : iconImg('coin') + fmt(cost)}</button>`;
      const pips = `<div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
      const need = locked ? g.region.unlocks.find((x) => x.id === u.requires)?.name : '';
      const lockNote = locked ? `<small class="lock">${need} gerekir</small>` : '';
      return `<div class="up-row ${locked ? 'locked' : ''}">
        <div class="up-ico">${iconImg(u.icon)}</div>
        <div class="up-mid"><b>${u.name}</b><small>${u.info(lvl)}</small>${pips}${lockNote}</div>
        ${btn}
      </div>`;
    }).join('');
    this.refreshAfford();
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
        <span class="node-stars">${open ? `Sv. ${lvl}` : 'Kilitli'}</span>
      </button>`;
    });
    const b = P.boss();
    nodes.push(`<button class="node capital" data-node="capital" style="left:${CAPITAL.map.x}%;top:${CAPITAL.map.y}%">
      <span class="node-ico">${iconImg('castle')}</span>
      <span class="node-name">${CAPITAL.name}</span>
      <span class="node-stars">${P.campaign.won ? 'Zafer ✓' : `${b.weapon} %${Math.round(P.weaponProgress() * 100)}`}</span>
    </button>`);
    this.el.mapNodes.innerHTML = nodes.join('');
  }

  selectNode(id) {
    const P = this.profile;
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
    const flow = lvl >= 1
      ? `Kervanlar Ambar'a dakikada <b>${rate.toFixed(1)}</b> ${ITEMS[r.exports].name.toLowerCase()} götürüyor`
      : `İlk sipariş bitince ${ITEMS[r.exports].name.toLowerCase()} kervanı başlar`;
    const imp = r.depot ? `<p class="card-flow">${iconImg(r.depot.type)}Kervanla gelir: <b>${ITEMS[r.depot.type].name}</b></p>` : '';
    const prev = REGIONS[idx - 1];
    const btn = here
      ? '<button class="go-btn here" disabled>Buradasın</button>'
      : open
        ? `<button class="go-btn" data-go="${id}">${P.data.regions[id]?.visited ? 'GİT' : 'YOLA ÇIK'}</button>`
        : `<button class="go-btn" disabled>🔒 ${prev.name}: ${REGION_UNLOCK_LEVEL}. sipariş gerekir (${P.level(prev.id)}/${REGION_UNLOCK_LEVEL})</button>`;
    return `<div class="card-head">${iconImg(r.icon, 'ico card-ico')}<div><b>${r.name}</b><span class="card-sub">Sipariş seviyesi ${lvl}</span></div></div>
      <p class="card-intro">${r.intro}</p>
      <div class="card-order"><small>Sıradaki sipariş (${orderSeals(lvl)} mühür)</small><div class="sold">${items}</div></div>
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
        <button class="give" data-part="${p.id}" ${canGive ? '' : 'disabled'}>${k >= 1 ? '✓' : 'Gönder'}</button>
        <div class="bar big"><i style="width:${Math.round(k * 100)}%"></i></div></div>`;
    }).join('');
    const trophies = P.trophies().map((id) => { const x = BOSSES.find((bb) => bb.id === id); return `<span title="${x.name}">${iconImg(x.icon)}</span>`; }).join('');
    let action;
    if (c.won) {
      const bn = P.bounty();
      const ok = P.ambar(bn.type) >= bn.amount;
      action = `<div class="bounty"><b>Kraliyet Görevi #${c.bountyN + 1}</b>
        <span>${iconImg(bn.type)} ${bn.amount} ${ITEMS[bn.type].name.toLowerCase()} gönder (Ambar: ${P.ambar(bn.type)})</span>
        <button class="go-btn" data-act="bounty" ${ok ? '' : 'disabled'}>${iconImg('seal')} +${bn.seals} Mühür</button></div>
        <p class="card-note">Yeni düşman ${duration(P.timeLeft())} sonra geliyor.</p>`;
    } else {
      action = `<div class="card-row">
          <button class="go-btn alt" data-part="all">Ambar'dan hepsini gönder</button>
          <button class="go-btn" data-act="battle" ${P.weaponReady() ? '' : 'disabled'}>⚔ SEFERE ÇIK</button>
        </div>`;
    }
    return `<div class="card-head">${iconImg(b.icon, 'ico card-ico')}<div><b>${b.week + 1}. Hafta: ${b.name}</b><span class="card-sub">${c.won ? 'Yenildi!' : `Kalan süre ${duration(P.timeLeft())}`} · ${b.weapon}</span></div></div>
      <p class="card-intro">${b.story}</p>
      <div class="parts">${rows}</div>
      ${action}
      <div class="card-row">
        <button class="go-btn alt" data-act="ambar">${iconImg('chest')} Ambar</button>
        <button class="go-btn alt" data-act="seals">${iconImg('seal')} Mühürler</button>
      </div>
      ${trophies ? `<div class="trophies"><small>Ganimet salonu (satışlar +%${Math.round(P.trophies().length * TROPHY_BONUS * 100)})</small><div>${trophies}</div></div>` : ''}`;
  }

  ambarCard() {
    const P = this.profile;
    const mats = ['ingot', 'bronze', 'steel', 'goldleaf', 'crystal', 'dragonfire'];
    const rows = mats.map((t) => `<span>${iconImg(t)}${fmt(P.ambar(t))}</span>`).join('');
    return `<div class="card-head">${iconImg('chest', 'ico card-ico')}<div><b>Krallık Ambarı</b><span class="card-sub">Bölgelerin Kraliyet Sandığı'na koyduğun ve kervanların getirdiği mallar</span></div></div>
      <div class="sold big">${rows}</div>
      <p class="card-note">Ambar hem haftalık silahı hem de bölgelerin kervan duraklarını besler: vadideki miğferci demiri, kaledeki su çekici bronzu buradan alır.</p>
      <button class="go-btn alt" data-act="capital">← Sefer</button>`;
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
        ${maxed ? '<button class="buy max" disabled>MAKS</button>' : `<button class="buy ${P.data.seals < cost ? 'cant' : ''}" data-meta="${m.id}">${iconImg('seal')}${cost}</button>`}
      </div>`;
    }).join('');
    return `<div class="card-head">${iconImg('seal', 'ico card-ico')}<div><b>Krallık Mühürleri</b><span class="card-sub">Siparişler, seferler ve görevler mühür verir. Bonuslar bütün bölgelerde geçerli.</span></div></div>
      <div class="seal-list">${rows}</div>
      <button class="go-btn alt" data-act="capital">← Sefer</button>`;
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
    const seals = P.winBoss();
    this.closeMap();
    this.playBattle(b, seals);
  }

  playBattle(b, seals) {
    const el = document.createElement('div');
    el.id = 'finale';
    this.root.appendChild(el);
    const scene = (html, cls = '') => { el.className = cls; el.innerHTML = `<div class="fin-stage">${html}</div>`; };
    const steps = [
      [0, () => scene(`${iconImg('castle', 'ico fin-ico')}<p>Altı bölgenin malzemesi Kraliyet Örsü'nde birleşti...</p>`)],
      [2200, () => scene(`<div class="fin-anvil">${iconImg('hammer', 'ico fin-ico hammer')}</div><p>Ustalar ${b.weapon} için çekiçlerini kaldırdı.</p>`, 'forging')],
      [2600, () => { sfx.clang(); el.classList.add('flash'); }],
      [3300, () => { sfx.clang(); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }],
      [4000, () => { sfx.clang(); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }],
      [4800, () => { sfx.unlock2(); scene(`<div class="fin-sword">${iconImg(b.weaponIcon, 'ico fin-ico big')}</div><h2>${b.weapon}</h2><p>Krallığın bütün bölgeleri bu silahta birleşti.</p>`, 'reveal'); }],
      [8500, () => scene(`<div class="fin-dragon">${iconImg(b.icon, 'ico fin-ico big')}</div><p>Kral orduyla ${b.name} üzerine yürüdü...</p>`, 'battle')],
      [11000, () => { sfx.deny(); el.classList.add('strike'); }],
      [12100, () => {
        sfx.unlock2();
        scene(`<div class="fin-stars">★ ★ ★</div><h2>${b.name} yenildi!</h2>
          <p>Ganimet salonuna yeni bir hatıra kondu: bütün satışlar kalıcı olarak <b>+%3</b>. <b>+${seals} Mühür</b></p>
          <div class="fin-ng"><b>Krallık durmuyor</b><span>Haftanın kalanında Kraliyet Görevleri mühür verir. Yeni düşman ${duration(this.profile.timeLeft())} sonra geliyor; bölgelerini büyütmeye devam et.</span></div>
          <button class="go-btn" data-fin="close">Krallığa dön</button>`, 'victory');
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

  orderPopup(region, level, seals, gold) {
    const idx = regionIndex(region.id);
    const next = REGIONS[idx + 1];
    const unlock = level === REGION_UNLOCK_LEVEL && next ? `<p class="unlock">Yeni bölge açıldı: <b>${next.name}</b></p>` : '';
    const caravan = level === 1 ? `<p>Kervanlar artık ${ITEMS[region.exports].name.toLowerCase()} malını Krallık Ambarı'na taşıyor.</p>` : '';
    this.modal(`<div class="modal-stars"><i class="on">★</i></div>
      <h2>Sipariş ${level} tamam!</h2>
      <p>${region.name} Kral'ın siparişini teslim etti.</p>
      ${caravan}${unlock}
      <p class="seal-gain">${iconImg('seal')} +${seals} Mühür · ${iconImg('coin')} +${fmt(gold)}</p>
      <div class="card-row">
        <button class="go-btn alt" data-modal="close">Devam et</button>
        <button class="go-btn" data-modal="map">Haritayı aç</button>
      </div>`);
  }

  weekPopup(rolled) {
    const last = rolled[rolled.length - 1];
    const b = this.profile.boss();
    this.modal(`<div class="modal-big">${iconImg(b.icon, 'ico huge')}</div>
      <h2>${b.week + 1}. Hafta: ${b.name}</h2>
      <p>${last.won ? `${last.name} yenilmişti.` : `${last.name} kaçtı (silah %${Math.round(last.progress * 100)}). Ambar'daki malzemen korunuyor.`}</p>
      <p>${b.story}</p>
      <button class="go-btn" data-modal="map">Seferi aç</button>`);
  }

  offlinePopup(info) {
    const list = Object.entries(info.gained).map(([t, n]) => `<span>${iconImg(t)}+${n}</span>`).join('');
    if (!list) return;
    const h = Math.floor(info.sec / 3600), m = Math.floor((info.sec % 3600) / 60);
    this.modal(`<h2>Kervanlar yolda</h2>
      <p>Sen yokken (${h ? h + ' sa ' : ''}${m} dk) bölgelerin Krallık Ambarı'na gönderdi:</p>
      <div class="sold big">${list}</div>
      <button class="go-btn" data-modal="close">Topla</button>`);
  }
}

function duration(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  return d ? `${d}g ${h}s` : h ? `${h}s ${m % 60}dk` : `${m % 60}dk`;
}


export function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}
