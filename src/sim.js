// Ekonomi dengesi için oyunu kendi kendine oynayan bot (sadece geliştirme).
// Tarayıcı konsolunda: await sim.run(saat)  → bölgenin sipariş seviyelerine kaç dakikada ulaşıldığını raporlar.
// Bot, dikkatli bir oyuncu gibi davranır: paraları toplar, işçi ve yükseltme alır, inşa alanlarını açar,
// darboğazdaki kaynağı toplar, atölye çıktısını taşır ve siparişi teslim eder.
import { stats, upgradeCost } from './config.js';
import { Worker, GatherNode } from './game.js';

const PRIORITY = ['worker', 'craft', 'capacity', 'gather', 'speed', 'fame', 'training'];

export class Bot {
  constructor(game) {
    this.g = game;
    // hareket için bir işçinin yol bulma (köprü, engelden kaçma) mantığını oyuncuya bağla
    const h = new Worker(game, { id: 'bot', look: 'player', hauler: true }, 0);
    h.char.removeFromParent();
    h.char = game.player.char;
    h.pos = game.player.pos;
    h.vel = game.player.vel;
    h.stack = game.player.stack;
    h.jitter.set(0, 0, 0);
    this.h = h;
    this.task = null;
    this.t = 0;
    this.buyT = 0;
  }

  // Satın alma: inşa alanı yakınsa ona para biriktir, değilse en ucuz faydalı geliştirmeyi al
  shop() {
    const g = this.g;
    // 3. sipariş bitti: bütün altını orduya ver, yeterince güçlenince bekçiye saldır
    if (g.guardianReady()) {
      for (let guard = 0; guard < 40; guard++) {
        const opts = g.region.army.filter((u) => g.canRecruit(u)).map((u) => ({ u, cost: g.armyCost(u) }));
        if (!opts.length) break;
        opts.sort((a, b) => a.cost / a.u.power - b.cost / b.u.power);
        const best = opts.find((o) => o.cost <= g.gold);
        if (!best || g.armyPower() >= g.region.guardian.power) break;
        g.recruit(best.u.id);
      }
      if (g.armyPower() >= g.region.guardian.power) g.attackGuardian();
      return;
    }
    const pad = g.pads.find((p) => p.visible);
    for (let guard = 0; guard < 20; guard++) {
      const opts = g.upgrades.filter((u) => g.canUpgrade(u)).map((u) => ({ u, cost: g.costOf(u), rank: PRIORITY.indexOf(u.worker ? 'worker' : u.id) }));
      if (!opts.length) return;
      opts.sort((a, b) => a.cost * (1 + a.rank * 0.15) - b.cost * (1 + b.rank * 0.15));
      const best = opts[0];
      const reserve = pad && pad.remaining <= best.cost * 4 ? pad.remaining : 0;
      if (g.gold - best.cost < reserve || g.gold < best.cost) return;
      g.buyUpgrade(best.u.id);
    }
  }

  choose() {
    const g = this.g;
    const st = g.player.stack;
    // 1) biriken paralar
    const coins = g.counters.find((c) => c.unlocked && c.coins.total >= 6);
    if (coins) return { zone: coins.coinPos, r: 0.6, done: () => coins.coins.total === 0, max: 6 };
    // 2) parası yeten inşa alanı
    const pad = g.pads.find((p) => p.visible && g.gold >= p.remaining);
    if (pad) return { zone: pad.pos, r: 1.1, done: () => !pad.visible, max: 6 };
    // 3) elindekini bırak
    if (st.total > 0) {
      const type = st.items[st.total - 1].type;
      const dst = g.destFor(type) || (g.orderRemaining(type) > 0 ? g.chest : type === g.region.exports ? g.caravan : null);
      if (dst) return { zone: dst.zone, r: dst.r * 0.6, done: () => !st.has(type), max: 8 };
      st.take(type)?.mesh.removeFromParent(); // bırakacak yer yoksa at
      return null;
    }
    // 4) atölye ya da kervan durağı çıktısını taşı
    const srcs = [...g.stations.filter((s) => s.unlocked), ...(g.depot?.unlocked ? [g.depot] : [])];
    const full = srcs.filter((s) => s.output.total >= 3 && g.destFor(s.recipe ? s.recipe.out : s.type, s)).sort((a, b) => b.output.total - a.output.total)[0];
    if (full) return { zone: full.zone, r: full.r * 0.6, done: () => st.full || full.output.total === 0, max: 6 };
    // 5) darboğazdaki hammaddeyi topla
    let best = null, bestNeed = Infinity;
    for (const n of g.nodes) {
      if (!n.active || (n.def.hazard && g.hazard?.state !== 'sleep')) continue;
      const rv = g.region.layout.river;
      if (rv && !g.unlocked.has(rv.bridge) && Math.sign(n.zone.x - rv.x) !== Math.sign(g.player.pos.x - rv.x)) continue;
      const users = g.stations.filter((s) => s.unlocked && s.accepts(n.type));
      // sırada bu hammaddeyi isteyen müşteri varsa ham da satılabilir
      const wanted = g.counters.some((c) => c.unlocked && c.shelf.count(n.type) < 2 && c.queue.some((q) => q.wants === n.type));
      if (!users.length && !wanted) continue;
      const need = wanted ? 0.05 : Math.min(...users.map((s) => s.inputs[n.type].total / s.inputs[n.type].cap));
      if (need < bestNeed) { bestNeed = need; best = n; }
    }
    if (best && bestNeed < 1) return { zone: best.zone, r: best.r * 0.5, done: () => st.full || (best.def.hazard && g.hazard?.state !== 'sleep'), max: 12 };
    return null;
  }

  update(dt) {
    const g = this.g;
    this.buyT -= dt;
    if (this.buyT <= 0) { this.buyT = 2; this.shop(); }
    this.h.speed = g.player.speed;
    this.h.working = false;
    if (!this.task) {
      this.task = this.choose();
      this.t = 0;
      if (!this.task) { g.player.vel.multiplyScalar(0.5); return; }
    }
    const k = this.task;
    if (!this.h.near(k.zone, Math.max(0.3, k.r))) {
      this.h.goTo(k, dt);
      // ulaşılamayan hedefte takılma
      this.travel = (this.travel || 0) + dt;
      if (this.travel > 25) { this.task = null; this.travel = 0; }
    } else {
      this.travel = 0;
      g.player.vel.set(0, 0, 0);
      this.t += dt;
      if (k.done() || this.t > k.max) this.task = null;
    }
  }
}

// Sessiz ve hızlı simülasyon: arayüz güncellemesi yok, 0.1 sn adım
export function quiet(game) {
  const ui = game.ui;
  for (const k of ['floater', 'toast', 'orderPopup', 'setOrder', 'setGold', 'objective', 'setUpgradeBadge', 'refreshUpgrades']) ui[k] = () => {};
  for (const { b } of game.stationBubbles) b.show(false);
  game.stationBubbles = [];
  game.fullBubble.show(false);
}

export async function run(game, hours, { report = 15, dt = 0.1 } = {}) {
  if (!game.bot) { quiet(game); game.bot = new Bot(game); }
  const log = [];
  const steps = Math.round((hours * 3600) / dt);
  let lastLevel = game.rs.level;
  game.simTime ||= 0;
  for (let i = 0; i < steps; i++) {
    game.update(dt, { x: 0, z: 0 });
    game.simTime += dt;
    if (game.rs.level !== lastLevel) {
      lastLevel = game.rs.level;
      log.push(`${(game.simTime / 60).toFixed(0)} dk: sipariş seviyesi ${lastLevel}`);
    }
    if (i % Math.round((report * 60) / dt) === 0) {
      log.push(`${(game.simTime / 60).toFixed(0)} dk: altın ${Math.floor(game.gold)}, işçi ${game.workers.length}, açık: ${[...game.unlocked].join(',') || '-'}, sipariş ${JSON.stringify(game.orderView().items.map((x) => `${x.type} ${x.have}/${x.need}`))}`);
    }
    if (i % 3000 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return log;
}

// Bölgede verilen sipariş seviyesine ulaşana kadar oyna; geçen oyun süresini (dk) döndürür
export async function until(game, level, maxHours = 6) {
  const t0 = game.simTime || 0;
  while (game.rs.level < level && (game.simTime || 0) - t0 < maxHours * 3600) await run(game, 0.05, { report: 9999 });
  return Math.round(((game.simTime || 0) - t0) / 60);
}

export { stats, upgradeCost, GatherNode };
