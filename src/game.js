// Oyun mantığı (bir bölge için): kaynaklar, atölyeler, tezgahlar, Kraliyet Sandığı, inşa alanları,
// işçiler, müşteriler, sipariş/yıldız ve öğretici. Bölgeye özel her şey src/regions/ verisinden gelir.
import * as THREE from 'three';
import {
  ITEMS, STATION_INPUT_CAP, STATION_OUTPUT_CAP, SHELF_CAP, QUEUE_MAX,
  BASE_UPGRADES, upgradeCost, stats, WORKER_GROWTH, WORKER_MAX, orderSeals, DEPOT_INTERVAL, DEPOT_CAP,
  ARMY_GROWTH, ARMY_MAX, GUARDIAN_TRIES, guardianSeals, REGION_UNLOCK_LEVEL, FIGHT_TIME,
} from './config.js';
import { Arena } from './arena.js';
import { MACHINES, animateMachine, makeDepot, makeWagon } from './machines.js';
import { REGIONS } from './regions/index.js';

const REGIONS_BY_EXPORT = Object.fromEntries(REGIONS.map((r) => [r.exports, r.name]));
import {
  makeCharacter, animateCharacter, makeStall, makeChest, C, mat,
} from './models.js';
import { Stack, columnLayout, gridLayout, vanish, vanishFollow, updateVanishing, setStackScene } from './stack.js';
import { buildWorld, makeDecal, makeColliders, collide, v3 } from './world.js';
import { sfx } from './audio.js';
import { Effects } from './effects.js';
import { ICON_DRAW } from './icons.js';
import { L, T } from './i18n.js';
import { computePower } from './power.js';

const V = THREE.Vector3;
const tmp = new V();
const XFER = 0.075; // eşya aktarım aralığı (sn)

const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const lerpAngle = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
const randInt = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));

const CANOPY = { green: [C.green, C.cream], red: [C.red, C.gold], blue: [C.blue, C.cream], purple: [C.purple, C.gold] };

// ---------------------------------------------------------------------------
// Karakter tabanı (oyuncu, işçi)
class Agent {
  constructor(game, look, pos, cap) {
    this.game = game;
    this.char = makeCharacter(look);
    this.char.position.copy(pos);
    game.scene.add(this.char);
    this.pos = this.char.position;
    this.vel = new V();
    this.stack = new Stack(this.char.userData.back, columnLayout, cap);
    this.gatherT = 0;
    this.xferT = 0;
    this.working = false;
    this.moving = false;
    this.radius = 0.38;
    this.speed = 4;
  }

  move(dx, dz, dt) {
    const tx = dx * this.speed, tz = dz * this.speed;
    const k = Math.min(1, dt * 12);
    this.vel.x += (tx - this.vel.x) * k;
    this.vel.z += (tz - this.vel.z) * k;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.game.collide(this.pos, this.radius);
    if (dx * dx + dz * dz > 0.01) this.char.rotation.y = lerpAngle(this.char.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 14));
    this.moving = this.vel.lengthSq() > 0.2;
  }

  near(p, r) { return flat(this.pos, p) < r; }

  updateVisual(dt) {
    this.char.userData.carrying = this.stack.total > 0;
    animateCharacter(this.char, dt, this.moving, this.vel.length() / 4.5, this.working);
    this.stack.update(dt, this.moving ? Math.min(1, this.vel.length() / 4) : 0);
  }

  audible() { return flat(this.pos, this.game.player.pos) < 9; }
}

// ---------------------------------------------------------------------------
class GatherNode {
  constructor(game, def, visuals) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.type = def.type;
    this.zone = v3(def.zone);
    this.r = def.r;
    this.visuals = visuals;
    this.decal = makeDecal(def.label, def.type, { round: true, w: def.r * 2 + 0.3, d: def.r * 2 + 0.3 });
    this.decal.position.x = this.zone.x;
    this.decal.position.z = this.zone.z;
    game.scene.add(this.decal);
    for (const v of visuals) v.userData.shake = 0;
  }

  get active() { return !this.def.requires || this.game.unlocked.has(this.def.requires); }

  // Toplamaya devam ediyorsa true, sırt doluysa false
  gather(agent, dt, interval) {
    if (agent.stack.full) return false;
    if (this.def.hazard && this.game.hazard?.danger) return true; // bekle
    agent.working = true;
    agent.gatherT += dt;
    if (agent.gatherT >= interval * (this.def.rate || 1)) {
      agent.gatherT = 0;
      // en yakın ağaca/kayaya vur
      let best = this.visuals[0], bd = Infinity;
      for (const v of this.visuals) { const d = flat(v.position, agent.pos); if (d < bd) { bd = d; best = v; } }
      const from = best ? best.position : this.zone;
      if (best) best.userData.shake = 1;
      tmp.copy(from).setY(1.1);
      agent.stack.spawn(this.type, tmp);
      // bereket: her toplama iki kaynak verir
      if (this.game.profile.boostActive() && !agent.stack.full) agent.stack.spawn(this.type, tmp);
      const fx = this.game.fx;
      if (this.def.visual === 'trees') fx.leaves(tmp.clone().setY(2.2));
      else fx.chips(tmp, this.def.speck ?? C.ore);
      if (agent.audible()) {
        if (this.def.visual === 'trees') sfx.chop(); else sfx.pick();
        sfx.pop(agent.stack.total);
      }
      agent.char.rotation.y = Math.atan2(from.x - agent.pos.x, from.z - agent.pos.z);
    }
    return true;
  }

  update(dt) {
    this.decal.visible = this.active;
    for (const v of this.visuals) {
      const u = v.userData;
      if (u.shake > 0) {
        u.shake = Math.max(0, u.shake - dt * 4);
        if (this.def.visual === 'trees') v.rotation.z = Math.sin(u.shake * 30) * 0.07 * u.shake;
        else v.scale.setScalar(1 + Math.sin(u.shake * 20) * 0.06 * u.shake);
      }
    }
  }
}

// ---------------------------------------------------------------------------
class Station {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.recipe = def.recipe;
    const model = MACHINES[def.model](def.tint);
    this.model = model;
    model.position.copy(v3(def.pos));
    game.scene.add(model);
    this.zone = v3(def.zone);
    this.r = def.r;
    const slots = model.userData.slots;
    this.inputs = {};
    // yakıt (ör. kömür) tarifin parçası değildir; fırını ısıtır
    this.fuel = def.fuel || null;
    this.heat = 0;
    const inTypes = Object.keys(this.recipe.in);
    if (this.fuel) inTypes.push(this.fuel.type);
    inTypes.forEach((type, i) => {
      const a = new THREE.Object3D();
      a.position.copy(slots['in' + i]);
      model.add(a);
      this.inputs[type] = new Stack(a, gridLayout(2, 2, 0.36, 0.36, ITEMS[type].h + 0.02), STATION_INPUT_CAP);
    });
    const oa = new THREE.Object3D();
    oa.position.copy(slots.out);
    model.add(oa);
    this.output = new Stack(oa, gridLayout(3, 2, 0.6, 0.45, ITEMS[this.recipe.out].h + 0.02), STATION_OUTPUT_CAP);
    this.decal = makeDecal(def.label, this.recipe.out, { w: def.r * 2, d: def.r * 1.6 });
    this.decal.position.x = this.zone.x;
    this.decal.position.z = this.zone.z + 0.15;
    game.scene.add(this.decal);
    this.busy = false;
    this.t = 0;
    this.fxT = 0;
    this.hitT = 0;
    this.hitBase = model.userData.hit?.position.y ?? 0;
  }

  get unlocked() { return !this.def.requires || this.game.unlocked.has(this.def.requires); }

  setVisible(v) { this.model.visible = v; this.decal.visible = v; }

  accepts(type) { return type in this.inputs; }

  // Baloncuk için: her girdinin ne kadar olduğu
  needs() {
    const list = Object.entries(this.recipe.in).map(([type, n]) => ({ type, n, have: this.inputs[type].total }));
    if (this.fuel) list.push({ type: this.fuel.type, n: 1, have: this.inputs[this.fuel.type].total, fuel: true });
    return list;
  }

  tryDrop(agent, only) {
    const st = agent.stack;
    for (let i = st.items.length - 1; i >= 0; i--) {
      const type = st.items[i].type;
      if (only && type !== only) continue;
      if (!this.accepts(type) || this.inputs[type].full) continue;
      st.transferTo(this.inputs[type], type);
      this.game.stat('drop_' + this.id);
      return type;
    }
    return null;
  }

  tryPick(agent) {
    if (this.output.total === 0 || agent.stack.full) return null;
    return this.output.transferTo(agent.stack);
  }

  update(dt) {
    if (!this.unlocked) return;
    const ud = this.model.userData;
    const mult = stats.craft(this.game.levels.craft) * this.game.profile.craftBonus() * (this.game.profile.boostActive() ? 0.5 : 1);
    const hot = !this.fuel || this.heat > 0 || this.inputs[this.fuel.type].total > 0;
    if (!this.busy) {
      const ok = hot && Object.entries(this.recipe.in).every(([t, n]) => this.inputs[t].total >= n) && this.output.total < STATION_OUTPUT_CAP;
      if (ok) {
        const center = this.model.localToWorld(new V(0, 1, 0));
        for (const [t, n] of Object.entries(this.recipe.in)) for (let i = 0; i < n; i++) this.inputs[t].consume(t, center);
        this.busy = true;
        this.t = 0;
      }
    } else {
      // yakıtlı fırın: ısı bitince bir kömür daha yakar, kömür yoksa bekler
      let running = true;
      if (this.fuel) {
        if (this.heat <= 0 && this.inputs[this.fuel.type].consume(this.fuel.type, this.model.localToWorld(new V(0, 1, 0)))) this.heat = this.fuel.burn;
        running = this.heat > 0;
        if (running) this.heat -= dt;
      }
      if (running) this.t += dt / (this.recipe.time * mult);
      if (this.t >= 1) {
        this.busy = false;
        const near = flat(this.zone, this.game.player.pos) < 9;
        // şansa bağlı üretim (ör. elemede altın çıkmayabilir)
        if (this.recipe.chance == null || Math.random() < this.recipe.chance) {
          this.output.spawn(this.recipe.out, this.model.localToWorld(new V(0, 1.2, 0.3)));
          this.game.stat('made_' + this.recipe.out);
          if (near) sfx.pop(4);
        } else {
          this.game.fx.chips(this.model.localToWorld(new V(0, 0.9, 0.4)), 0xe2c27a);
          if (near) this.game.ui.floater(this.model, L('boş', 'empty'), 'miss');
        }
      }
    }
    this.running = this.busy && (!this.fuel || this.heat > 0);
    // görsel geri bildirim
    if (ud.glow) {
      const target = this.running ? 1.6 + Math.sin(performance.now() * 0.012) * 0.3 : 0.5;
      ud.glow.material.emissiveIntensity += (target - ud.glow.material.emissiveIntensity) * Math.min(1, dt * 5);
      ud.light.intensity += ((this.running ? 6 : 0) - ud.light.intensity) * Math.min(1, dt * 5);
    }
    this.fxT -= dt;
    if (this.running && this.fxT <= 0) {
      if (ud.smoke) { this.game.fx.smoke(this.model.localToWorld(ud.smoke.clone())); this.fxT = 0.35; }
      if (ud.hit) {
        this.hitT = 1;
        this.game.fx.sparks(this.model.localToWorld(ud.spark.clone()));
        if (flat(this.zone, this.game.player.pos) < 8) sfx.clang();
        this.fxT = 0.55;
      }
    }
    if (ud.hit) {
      this.hitT = Math.max(0, this.hitT - dt * 5);
      ud.hit.position.y = this.hitBase + Math.sin(this.hitT * Math.PI) * 0.12;
    }
    animateMachine(ud, this.running, dt, this.game.time);
    if (ud.spark && !ud.hit && this.running && this.fxT <= 0) {
      this.game.fx.emit(this.model.localToWorld(ud.spark.clone()), { n: 4, color: ud.sparkColor || 0xffb347, glow: true, speed: 2.4, up: 3, life: 0.4, gravity: 12, scale: 0.5 });
      if (ud.hitArm && flat(this.zone, this.game.player.pos) < 8) sfx.clang();
      this.fxT = ud.hitArm ? 0.52 : 0.3;
    }
    for (const s of Object.values(this.inputs)) s.update(dt);
    this.output.update(dt);
  }

  // İşlem durumu (baloncuk için)
  progress() { return this.busy ? this.t : 0; }
  heatLevel() { return this.fuel ? Math.max(0, this.heat) / this.fuel.burn : 0; }
}

// ---------------------------------------------------------------------------
class Counter {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.accepts = [...new Set(def.customers.map((c) => c.wants))];
    this.pos = v3(def.pos);
    this.zone = v3(def.zone);
    this.r = 1.4;
    const model = makeStall(...CANOPY[def.canopy || 'green']);
    this.model = model;
    model.position.copy(this.pos);
    game.scene.add(model);
    const sa = new THREE.Object3D();
    sa.position.copy(model.userData.slots.shelf);
    model.add(sa);
    this.shelf = new Stack(sa, gridLayout(4, 2, 0.72, 0.42, 0.2), SHELF_CAP);
    this.coinPos = v3(def.coins);
    this.coinAnchor = new THREE.Object3D();
    this.coinAnchor.position.copy(this.coinPos);
    game.scene.add(this.coinAnchor);
    this.coins = new Stack(this.coinAnchor, gridLayout(3, 3, 0.3, 0.3, 0.055), Infinity);
    this.decal = makeDecal(def.label, def.icon, { w: this.r * 2.2, d: this.r * 1.5 });
    this.decal.position.x = this.zone.x;
    this.decal.position.z = this.zone.z;
    game.scene.add(this.decal);
    this.coinDecal = makeDecal(null, 'coin', { round: true, w: 1.9, d: 1.9, color: '#ffd84a' });
    this.coinDecal.position.x = this.coinPos.x;
    this.coinDecal.position.z = this.coinPos.z;
    game.scene.add(this.coinDecal);
    this.queue = [];
    this.leaving = [];
    this.spawnT = 3;
  }

  get unlocked() { return !this.def.requires || this.game.unlocked.has(this.def.requires); }

  setVisible(v) {
    this.model.visible = v;
    this.decal.visible = v;
    this.coinDecal.visible = v;
  }

  slot(i) { return new V(this.pos.x, 0, this.pos.z + 1.5 + i * 1.25); }

  tryDrop(agent, only) {
    if (this.shelf.full) return null;
    const st = agent.stack;
    for (let i = st.items.length - 1; i >= 0; i--) {
      const type = st.items[i].type;
      if (only && type !== only) continue;
      if (!this.accepts.includes(type)) continue;
      st.transferTo(this.shelf, type);
      this.game.stat('shelf_' + this.id);
      return type;
    }
    return null;
  }

  // Sadece üretilebilen ürünü isteyen müşteri gelir; rafta veya atölyede hazır olan daha sık gelir
  pickKind() {
    const g = this.game;
    const kinds = this.def.customers.filter((k) => g.producible(k.wants));
    if (!kinds.length) return null;
    const w = kinds.map((k) => {
      const t = k.wants;
      const waiting = this.queue.filter((c) => c.wants === t).length;
      const ready = g.stations.reduce((s, st) => s + (st.recipe.out === t ? st.output.total : 0), 0);
      return Math.max(0.2, 1 + this.shelf.count(t) * 2 + ready - waiting * 1.5);
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < kinds.length; i++) if ((r -= w[i]) <= 0) return kinds[i];
    return kinds[0];
  }

  addCoins(value) {
    const n = Math.max(1, Math.min(10, Math.round(value / 6)));
    const base = Math.floor(value / n);
    let rest = value - base * n;
    for (let i = 0; i < n; i++) {
      const v = base + (rest > 0 ? 1 : 0);
      if (rest > 0) rest--;
      if (this.coins.total >= 54) {
        this.coins.items[this.coins.total - 1].value += v;
        continue;
      }
      this.coins.spawn('coin', tmp.copy(this.pos).setY(1.6), { value: v });
    }
  }

  update(dt) {
    if (!this.unlocked) return;
    const g = this.game;
    this.spawnT += dt;
    const interval = stats.spawn(g.levels.fame) * (this.id === 'weapons' ? 1.15 : 1);
    if (this.queue.length < QUEUE_MAX && this.spawnT >= interval) {
      this.spawnT = 0;
      const kind = this.pickKind();
      if (kind) this.queue.push(new Customer(g, this, kind));
    }
    for (let i = 0; i < this.queue.length; i++) this.queue[i].update(dt, this.slot(i));
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].state === 'leave') this.leaving.push(...this.queue.splice(i, 1));
    }
    for (let i = this.leaving.length - 1; i >= 0; i--) {
      const c = this.leaving[i];
      c.update(dt, null);
      if (c.done) { c.dispose(); this.leaving.splice(i, 1); }
    }
    this.shelf.update(dt);
    this.coins.update(dt);
  }
}

// ---------------------------------------------------------------------------
class Customer {
  constructor(game, counter, kind) {
    this.game = game;
    this.counter = counter;
    this.wants = kind.wants;
    this.need = randInt(kind.need);
    this.got = 0;
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.char = makeCharacter(kind.look);
    this.char.position.set(counter.pos.x + this.side * 20, 0, game.region.layout.roadZ + (Math.random() - 0.5));
    game.scene.add(this.char);
    this.pos = this.char.position;
    this.path = [new V(counter.pos.x, 0, game.region.layout.roadZ)];
    this.state = 'queue';
    this.buyT = 0;
    this.arrived = false;
    this.waitT = 0;
    this.patience = 30 + this.need * 6;
    this.stack = new Stack(this.char.userData.hand, columnLayout, 10);
    this.bubble = game.ui.bubble(this.char, 2.45, 'want');
    this.renderBubble();
    this.speed = 3.4;
    this.moving = false;
    this.done = false;
  }

  renderBubble() {
    // sabrın son yarısında kırmızıya dönen bir çubuk görünür
    const left = 1 - this.waitT / this.patience;
    const bar = left < 0.5 ? `<i class="pat" style="width:${Math.ceil(left * 10) * 10}%"></i>` : '';
    this.bubble.set(`${this.game.ui.icon(this.wants)}<b>${this.got}/${this.need}</b>${bar}`);
  }

  walk(target, dt) {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.08) { this.moving = false; return true; }
    const s = Math.min(this.speed * dt, d);
    this.pos.x += (dx / d) * s;
    this.pos.z += (dz / d) * s;
    this.char.rotation.y = lerpAngle(this.char.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 10));
    this.moving = true;
    return false;
  }

  update(dt, slot) {
    if (this.state === 'queue') {
      if (this.path.length) {
        if (this.walk(this.path[0], dt)) this.path.shift();
      } else if (this.walk(slot, dt)) {
        this.char.rotation.y = lerpAngle(this.char.rotation.y, Math.PI, Math.min(1, dt * 8));
        this.arrived = true;
      }
      // sıra ilerlerken yürüyen müşteri de alışverişe devam eder
      if (this.arrived) this.buy(dt);
    } else if (this.path.length) {
      if (this.walk(this.path[0], dt)) this.path.shift();
    } else {
      this.done = true;
    }
    this.char.userData.carrying = this.stack.total > 0;
    animateCharacter(this.char, dt, this.moving, 0.75, false);
    this.stack.update(dt);
  }

  buy(dt) {
    this.waitT += dt;
    this.buyT += dt;
    if (this.buyT >= 0.28) {
      this.buyT = 0;
      const sh = this.counter.shelf;
      if (sh.has(this.wants)) {
        sh.transferTo(this.stack, this.wants);
        this.got++;
        this.waitT = 0;
        if (flat(this.pos, this.game.player.pos) < 10) sfx.drop();
        if (this.got >= this.need) { this.leave(true); return; }
      }
    }
    if (this.waitT >= this.patience) { this.leave(false); return; }
    this.renderBubble();
  }

  // Aldığı kadarını öder ve sıradan çıkar
  leave(happy) {
    const g = this.game;
    if (this.got > 0) {
      const value = Math.round(this.got * ITEMS[this.wants].price * stats.price(g.levels.fame) * g.profile.priceBonus());
      this.counter.addCoins(value);
      g.stat('sold_' + this.wants, this.got);
      g.ui.floater(this.char, `+${value}`, 'sale');
      if (flat(this.pos, g.player.pos) < 10) sfx.sale();
    }
    this.state = 'leave';
    this.bubble.set(happy ? '😊' : '😠');
    setTimeout(() => this.bubble.remove(), 900);
    // kuyruğun yanından çıkıp yola döner
    const roadZ = g.region.layout.roadZ;
    const x = this.counter.pos.x + this.side * 1.6;
    this.path = [new V(x, 0, this.pos.z), new V(x, 0, roadZ), new V(this.counter.pos.x + this.side * 22, 0, roadZ)];
    this.speed = 4;
  }

  dispose() {
    this.stack.clear();
    this.char.removeFromParent();
    this.bubble.remove();
  }
}

// ---------------------------------------------------------------------------
// Kraliyet Sandığı: sipariş edilen ürünler buraya teslim edilir
class RoyalChest {
  constructor(game, def) {
    this.game = game;
    this.pos = v3(def.pos);
    this.zone = v3(def.zone);
    this.r = def.r;
    this.model = makeChest();
    this.model.position.copy(this.pos);
    game.scene.add(this.model);
    this.decal = makeDecal(L('SİPARİŞ', 'ORDER'), 'chest', { w: def.r * 2.2, d: def.r * 1.6, color: '#ffd84a' });
    this.decal.position.x = this.zone.x;
    this.decal.position.z = this.zone.z;
    game.scene.add(this.decal);
    this.bump = 0;
  }

  tryDrop(agent, only) {
    const g = this.game;
    const st = agent.stack;
    for (let i = st.items.length - 1; i >= 0; i--) {
      const type = st.items[i].type;
      if (only && type !== only) continue;
      if (g.orderRemaining(type) <= 0) continue;
      const it = st.take(type);
      vanish(it.mesh, this.pos.clone().setY(0.8));
      g.deliver(type);
      this.bump = 1;
      return type;
    }
    return null;
  }

  update(dt, t) {
    this.bump = Math.max(0, this.bump - dt * 4);
    this.model.scale.setScalar(1 + Math.sin(this.bump * Math.PI) * 0.08);
    this.model.userData.flag.rotation.y = Math.sin(t * 2) * 0.15;
  }
}

// ---------------------------------------------------------------------------
// Kervan alanı: buraya bırakılan bölge malı doğrudan Krallık Ambarı'na (haftalık silaha) gider
class CaravanZone {
  constructor(game, chestDef) {
    this.game = game;
    this.type = game.region.exports;
    this.zone = v3([chestDef.zone[0], chestDef.zone[1] - 2.1]);
    this.r = 1.0;
    this.decal = makeDecal(L('KERVAN', 'CARAVAN'), this.type, { w: 2.1, d: 1.5, color: '#8fb4ff' });
    this.decal.position.set(this.zone.x, 0.03, this.zone.z);
    game.scene.add(this.decal);
  }

  tryDrop(agent, only) {
    const st = agent.stack;
    if ((only && only !== this.type) || !st.has(this.type)) return null;
    const it = st.take(this.type);
    vanish(it.mesh, this.zone.clone().setY(0.6));
    this.game.ship(this.type);
    return this.type;
  }
}

// ---------------------------------------------------------------------------
// Kervan durağı: Krallık Ambarı'ndan başka bölgenin malı gelir (ör. vadide miğfer için demir)
class Depot {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.type = def.type;
    this.model = makeDepot();
    this.model.position.copy(v3(def.pos));
    game.scene.add(this.model);
    this.zone = v3([def.pos[0], def.pos[1] + 1.5]);
    this.r = 1.2;
    const a = new THREE.Object3D();
    a.position.copy(this.model.userData.slots.out);
    this.model.add(a);
    this.output = new Stack(a, gridLayout(3, 2, 0.5, 0.45, ITEMS[this.type].h + 0.02), DEPOT_CAP);
    this.decal = makeDecal(L('GELEN', 'INCOMING'), this.type, { w: 2.4, d: 1.6, color: '#8fb4ff' });
    this.decal.position.set(this.zone.x, 0.03, this.zone.z);
    game.scene.add(this.decal);
    this.t = 0;
    this.bubble = game.ui.bubble(this.model, 2.9, 'depot');
  }

  get unlocked() { return !this.def.requires || this.game.unlocked.has(this.def.requires); }
  setVisible(v) { this.model.visible = v; this.decal.visible = v; }

  tryPick(agent) {
    if (this.output.total === 0 || agent.stack.full) return null;
    return this.output.transferTo(agent.stack);
  }

  update(dt) {
    this.bubble.show(this.unlocked && flat(this.zone, this.game.player.pos) < 9);
    if (!this.unlocked) return;
    // Ambar boşsa hangi bölgeye dönmek gerektiğini söyle
    const left = this.game.profile.ambar(this.type);
    const src = this.game.sourceOf(this.type);
    this.bubble.set(left > 0 ? `${L('Ambar', 'Storehouse')}: ${this.game.ui.icon(this.type)}${left}` : L(`Ambar boş! ${this.game.ui.icon(this.type)} ${src} kervanı bekleniyor`, `Storehouse empty! Waiting for ${this.game.ui.icon(this.type)} caravan from ${src}`));
    this.t += dt;
    if (this.t >= DEPOT_INTERVAL) {
      this.t = 0;
      if (!this.output.full && this.game.profile.takeAmbar(this.type, 1)) {
        this.output.spawn(this.type, this.model.localToWorld(new V(-0.8, 1.2, -0.4)));
      }
    }
    this.output.update(dt);
  }
}

// ---------------------------------------------------------------------------
// Para ödeyerek yeni yapı açılan alan
class Pad {
  constructor(game, def) {
    this.game = game;
    this.def = def;
    this.pos = v3(def.pos);
    this.r = 1.3;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 256;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false }));
    this.mesh.position.set(this.pos.x, 0.05, this.pos.z);
    this.mesh.renderOrder = 2;
    game.scene.add(this.mesh);
    this.stayT = 0;
    this.payT = 0;
    this.lastDrawn = -1;
    this.draw();
  }

  get paid() { return this.game.padPaid[this.def.id] || 0; }
  set paid(v) { this.game.padPaid[this.def.id] = v; }
  get remaining() { return Math.max(0, this.def.cost - this.paid); }
  get visible() {
    const d = this.def;
    return !this.game.unlocked.has(d.id) && (!d.requires || this.game.unlocked.has(d.requires));
  }

  draw() {
    const g = this.canvas.getContext('2d');
    const S = 256;
    g.clearRect(0, 0, S, S);
    const k = this.paid / this.def.cost;
    g.fillStyle = 'rgba(40,24,12,0.72)';
    rr(g, 8, 8, S - 16, S - 16, 30); g.fill();
    // ödeme ilerlemesi alttan dolar
    g.save();
    rr(g, 8, 8, S - 16, S - 16, 30); g.clip();
    g.fillStyle = 'rgba(242,194,48,0.55)';
    g.fillRect(0, S - 8 - (S - 16) * k, S, (S - 16) * k + 8);
    g.restore();
    g.lineWidth = 10; g.strokeStyle = '#f2c230';
    rr(g, 8, 8, S - 16, S - 16, 30); g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#fff';
    g.font = '27px "Lilita One", "Arial Black", sans-serif';
    wrapText(g, this.def.name, S / 2, 58, S - 40, 30);
    g.save(); g.translate(S / 2 - 70, 128); g.scale(0.5, 0.5); ICON_DRAW.coin(g); g.restore();
    g.font = '52px "Lilita One", "Arial Black", sans-serif';
    g.textAlign = 'left';
    g.lineWidth = 8; g.strokeStyle = 'rgba(40,24,12,0.9)';
    g.strokeText(String(this.remaining), S / 2 - 18, 170);
    g.fillText(String(this.remaining), S / 2 - 18, 170);
    this.tex.needsUpdate = true;
    this.lastDrawn = this.paid;
  }

  update(dt) {
    const g = this.game;
    const vis = this.visible;
    this.mesh.visible = vis;
    if (!vis) return;
    const p = g.player;
    if (!p.near(this.pos, this.r)) { this.stayT = 0; return; }
    this.stayT += dt;
    if (this.stayT < 0.35 || g.gold <= 0) return;
    // ~1.6 sn'de tamamı ödenir
    const rate = Math.max(this.def.cost / 1.6, 25);
    this.payT += dt * rate;
    const amt = Math.min(Math.floor(this.payT), g.gold, this.remaining);
    if (amt <= 0) return;
    this.payT -= amt;
    g.gold -= amt;
    this.paid += amt;
    g.ui.setGold(g.gold);
    if (Math.random() < 0.5) g.fx.glint(this.mesh.position.clone().setY(0.4));
    sfx.pay();
    if (this.remaining <= 0) g.unlock(this.def.id);
    else if (this.paid !== this.lastDrawn) this.draw();
  }
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function wrapText(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  lines.push(line);
  lines.forEach((l, i) => g.fillText(l, x, y + i * lh - (lines.length - 1) * lh * 0.5));
}

// ---------------------------------------------------------------------------
class Worker extends Agent {
  constructor(game, role, idx) {
    super(game, role.look, game.tavernDoor, 3);
    this.role = role;
    this.idx = idx;
    this.state = 'idle';
    this.wait = 0.5 + idx * 0.4;
    this.task = null;
    this.stuck = 0;
    this.lastPos = new V();
    this.detour = 0;
    this.detourDir = 1;
    const a = idx * 2.4 + (role.id.length % 3);
    this.jitter = new V(Math.cos(a), 0, Math.sin(a));
  }

  refreshStats() {
    const l = this.game.levels.training;
    this.speed = stats.workerSpeed(l);
    this.stack.cap = stats.workerCap(l);
    this.gatherInterval = stats.workerGather(l);
  }

  // Hedef nehrin öbür yakasındaysa önce köprü başına, sonra karşı yakaya yürü
  viaBridge(tgt) {
    const rv = this.game.region.layout.river;
    if (!rv || !this.game.unlocked.has(rv.bridge)) return tgt;
    const side = (x) => (x < rv.x ? -1 : 1);
    const mine = side(this.pos.x);
    if (mine === side(tgt.x)) return tgt;
    const edge = rv.w / 2 + 1.0;
    const onBridge = Math.abs(this.pos.z - rv.bridgeZ) < 0.7 && Math.abs(this.pos.x - rv.x) < edge + 0.3;
    return onBridge ? new V(rv.x - mine * (edge + 0.4), 0, rv.bridgeZ) : new V(rv.x + mine * edge, 0, rv.bridgeZ);
  }

  goTo(target, dt) {
    const final = tmp.copy(target.zone).addScaledVector(this.jitter, target.r * 0.45);
    const tgt = this.viaBridge(final);
    const routed = tgt !== final;
    let dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.25 && !routed) { this.vel.multiplyScalar(0.5); this.moving = false; return true; }
    dx /= d || 1; dz /= d || 1;
    // engele takıldıysa bir süre yana kay
    if (this.detour > 0) {
      this.detour -= dt;
      const px = -dz * this.detourDir, pz = dx * this.detourDir;
      dx = dx * 0.25 + px; dz = dz * 0.25 + pz;
      const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    }
    const before = this.lastPos.copy(this.pos);
    this.move(dx, dz, dt);
    if (flat(before, this.pos) < this.speed * dt * 0.35) {
      this.stuck += dt;
      if (this.stuck > 0.25) { this.detour = 0.7; this.detourDir = Math.random() < 0.5 ? -1 : 1; this.stuck = 0; }
    } else this.stuck = 0;
    return false;
  }

  update(dt) {
    const g = this.game;
    this.working = false;
    const t = this.task;
    switch (this.state) {
      case 'idle': {
        this.moving = false;
        this.vel.multiplyScalar(0.8);
        this.wait -= dt;
        if (this.wait > 0) break;
        const task = g.plan(this);
        if (!task) { this.wait = 1; break; }
        this.task = task;
        this.state = task.src ? 'toSrc' : 'toDst';
        break;
      }
      case 'toSrc':
        if (this.goTo(t.src, dt)) { this.state = 'load'; this.waitT = 0; }
        break;
      case 'load':
        if (t.src instanceof GatherNode) {
          if (!t.src.gather(this, dt, this.gatherInterval)) this.state = 'toDst';
        } else {
          this.xferT += dt;
          if (this.xferT >= XFER * 1.5) {
            this.xferT = 0;
            if (this.stack.full) { this.state = 'toDst'; break; }
            if (!t.src.tryPick(this)) {
              this.waitT += XFER * 1.5;
              if (this.stack.total > 0 && this.waitT > 0.6) this.state = 'toDst';
              else if (this.stack.total === 0 && this.waitT > 2.5) { this.state = 'idle'; this.wait = 0.3; }
            } else this.waitT = 0;
          }
        }
        break;
      case 'toDst':
        if (this.goTo(t.dst, dt)) { this.state = 'unload'; this.waitT = 0; }
        break;
      case 'unload':
        this.xferT += dt;
        if (this.xferT >= XFER * 1.5) {
          this.xferT = 0;
          if (t.dst.tryDrop(this, null)) { this.waitT = 0; if (this.audible()) sfx.drop(); break; }
          if (this.stack.total === 0) { this.state = 'idle'; this.wait = 0.15; break; }
          this.waitT += XFER * 1.5;
          if (this.waitT > 2.5) { this.state = 'idle'; this.wait = 0.5; }
        }
        break;
    }
    this.updateVisual(dt);
  }
}

// ---------------------------------------------------------------------------
export class Game {
  constructor(scene, ui, profile, region) {
    this.scene = scene;
    this.ui = ui;
    this.profile = profile;
    this.region = region;
    this.rs = profile.region(region.id);
    this.rs.visited = true;
    setStackScene(scene);
    this.fx = new Effects(scene);
    this.refs = buildWorld(scene, region);
    this.stats = {};
    this.pops = [];
    this.time = 0;

    // bölge kaydı
    this.upgrades = [
      ...BASE_UPGRADES.filter((u) => !u.crew),
      ...region.workers.map((w) => ({
        id: w.id, icon: w.icon, name: w.name, base: w.base, growth: WORKER_GROWTH, max: w.max || WORKER_MAX, worker: true, crew: true,
        requires: w.requires, info: (l) => `${l}/${w.max || WORKER_MAX} ${L('işçi', 'workers')}`,
      })),
      ...BASE_UPGRADES.filter((u) => u.crew),
    ];
    this.levels = this.rs.levels;
    for (const u of this.upgrades) this.levels[u.id] ??= 0;
    this.unlocked = new Set(this.rs.unlocked);
    this.padPaid = this.rs.padPaid;
    this.rs.delivered ||= {};
    this.rs.level ||= 0;
    this.rs.deliveredAll ||= 0;

    this.bounds = region.layout.bounds;
    this.colliders = makeColliders(region);
    this.tavernDoor = v3(region.layout.tavernDoor);

    this.nodes = region.nodes.map((n) => new GatherNode(this, n, this.refs.nodeVisuals[n.id] || []));
    this.stations = region.stations.map((s) => new Station(this, s));
    this.counters = region.counters.map((c) => new Counter(this, c));
    this.chest = new RoyalChest(this, region.chest);
    this.caravan = new CaravanZone(this, region.chest);
    this.depot = region.depot ? new Depot(this, region.depot) : null;
    this.caravans = [];
    this.caravanT = 8;
    this.pads = region.unlocks.map((u) => new Pad(this, u));
    this.applyUnlockVisibility();

    this.player = new Agent(this, 'player', v3(region.layout.spawn), 6);
    this.player.char.rotation.y = Math.PI;
    this.fullBubble = ui.bubble(this.player.char, 2.6, 'max');
    this.fullBubble.set('MAX');
    this.fullBubble.show(false);
    this.refreshPlayerStats();

    this.workers = [];
    for (const role of region.workers) for (let i = 0; i < this.levels[role.id]; i++) this.spawnWorker(role.id, true);

    this.stationBubbles = this.stations.map((s) => ({ s, b: ui.bubble(s.model, 3.1, 'station') }));

    // bölge bekçisinin arenası ve askerler
    this.arena = new Arena(this);
    this.arena.syncSoldiers();

    this.makeGuide();
    this.hazard = null;
    region.setup?.(this);
    this.collectAcc = 0;
    this.collectT = 0;
    this.saveT = 0;
    this.exportT = 0;
    this.fullT = 0;
    ui.setGold(this.gold);
    ui.setOrder(this.orderView());
  }

  // ---------- erişim ----------
  get gold() { return this.rs.gold; }
  set gold(v) { this.rs.gold = v; }
  node(id) { return this.nodes.find((n) => n.id === id); }
  station(id) { return this.stations.find((s) => s.id === id); }
  counter(id) { return this.counters.find((c) => c.id === id); }
  pad(id) { return this.pads.find((p) => p.def.id === id); }
  stat(k, n = 1) { this.stats[k] = (this.stats[k] || 0) + n; }
  collide(pos, r) { collide(pos, r, this.colliders, this.bounds, this.unlocked); }
  sourceOf(type) { return this.profile && REGIONS_BY_EXPORT[type] || ''; }
  producible(type) {
    return this.stations.some((s) => s.unlocked && s.recipe.out === type) || this.nodes.some((n) => n.active && n.type === type);
  }

  // ---------- kayıt ----------
  save() {
    this.rs.unlocked = [...this.unlocked];
    this.profile.save();
  }

  // ---------- sonsuz Kraliyet Siparişleri ----------
  order() { return this.profile.orderFor(this.region, this.rs.level); }
  orderRemaining(type) { return (this.order()[type] || 0) - (this.rs.delivered[type] || 0); }
  orderComplete() { return Object.keys(this.order()).every((t) => this.orderRemaining(t) <= 0); }
  deliveredTotal() { return this.rs.deliveredAll; }

  deliver(type) {
    this.rs.delivered[type] = (this.rs.delivered[type] || 0) + 1;
    this.rs.deliveredAll++;
    sfx.coin();
    this.ui.floater(this.chest.model, `+1`, 'order');
    if (this.orderComplete()) this.completeOrder();
    this.ui.setOrder(this.orderView());
  }

  // Bölgenin malı siparişte değilse Krallık Ambarı'na (başkente) gider
  ship(type) {
    this.profile.addAmbar(type, 1);
    this.stat('shipped', 1);
    this.ui.floater(this.chest.model, `+1`, 'ship');
    sfx.drop();
  }

  completeOrder() {
    const before = computePower(this.profile);
    const lvl = this.rs.level;
    const order = this.order();
    const seals = orderSeals(lvl);
    // sipariş bedeli altın olarak da ödenir
    const gold = Math.round(Object.entries(order).reduce((s, [t, n]) => s + ITEMS[t].price * n, 0) * 0.5);
    this.rs.level++;
    this.rs.delivered = {};
    this.profile.data.seals += seals;
    this.gold += gold;
    this.ui.setGold(this.gold);
    this.save();
    this.fx.confetti(this.chest.pos.clone().setY(1));
    sfx.unlock2();
    this.ui.orderPopup(this.region, this.rs.level, seals, gold, computePower(this.profile) - before);
  }

  // Şu anki siparişin altın değeri: reklam ve mağaza altını buna göre ölçeklenir
  orderValue() {
    return Object.entries(this.order()).reduce((s, [t, n]) => s + ITEMS[t].price * n, 0);
  }

  orderView() {
    const order = this.order();
    return {
      level: this.rs.level + 1,
      items: Object.entries(order).map(([type, need]) => ({ type, need, have: Math.min(this.rs.delivered[type] || 0, need) })),
    };
  }

  // ---------- ordu ve bölge bekçisi ----------
  // Asker türleri seviye atlar: seviye x tür başına saniyelik vuruş. Figürler arena.js'te.
  armyCount(id) { return this.rs.army?.[id] || 0; }
  armyCost(u) { return Math.round(u.base * Math.pow(ARMY_GROWTH, this.armyCount(u.id))); }
  armyDps() { return this.region.army.reduce((s, u) => s + this.armyCount(u.id) * u.dps, 0); }
  armyPower() { return this.armyDps(); }
  // 30 saniyede canavarın canını bitirebilir mi?
  canWin() { return this.armyDps() * FIGHT_TIME >= this.region.guardian.hp; }
  canRecruit(u) { return (!u.requires || this.unlocked.has(u.requires)) && this.armyCount(u.id) < ARMY_MAX; }

  recruit(id) {
    const u = this.region.army.find((x) => x.id === id);
    if (!this.canRecruit(u)) return false;
    const cost = this.armyCost(u);
    if (this.gold < cost) { sfx.deny(); return false; }
    this.gold -= cost;
    this.rs.army ||= {};
    this.rs.army[id] = this.armyCount(id) + 1;
    this.ui.setGold(this.gold);
    sfx.buy();
    this.arena.syncSoldiers();
    this.save();
    return true;
  }

  // Bekçiye saldırı hakkı cihazın gününe göre her gün yenilenir
  guardianTriesLeft() {
    const day = new Date().toDateString();
    const t = this.rs.bossTries;
    return t?.day === day ? Math.max(0, GUARDIAN_TRIES - t.n) : GUARDIAN_TRIES;
  }

  guardianReady() { return this.rs.level >= REGION_UNLOCK_LEVEL && !this.rs.guardianDefeated; }
  get fighting() { return this.arena.state === 'fight'; }

  // Saldırıyı başlatır: askerler arenaya yürür ve FIGHT_TIME saniye vurur. Sonuç onGuardianResult'ta.
  attackGuardian() {
    if (!this.guardianReady() || this.guardianTriesLeft() <= 0 || this.fighting || !this.figuresReady()) return false;
    const day = new Date().toDateString();
    const t = this.rs.bossTries?.day === day ? this.rs.bossTries : { day, n: 0 };
    t.n++;
    this.rs.bossTries = t;
    this.save();
    this.arena.startFight();
    return true;
  }

  figuresReady() { return this.arena.figs.length > 0; }

  onGuardianResult(won, hpLeft = 0) {
    const gd = this.region.guardian;
    let seals = 0, gold = 0;
    const before = computePower(this.profile);
    if (won) {
      this.rs.guardianDefeated = true;
      // hız bonusu: bölgede bekçiye kadar geçen aktif oyun süresi
      this.rs.clearSec ||= Math.round(this.rs.playSec || 0);
      seals = guardianSeals(REGIONS.findIndex((r) => r.id === this.region.id));
      gold = Math.round(this.orderValue() * 0.5);
      this.profile.data.seals += seals;
      this.gold += gold;
      this.ui.setGold(this.gold);
      sfx.unlock2();
    } else sfx.deny();
    this.save();
    const power = computePower(this.profile) - before;
    this.ui.guardianResult({ won, seals, gold, hpLeft, hp: gd.hp, dps: this.armyDps(), triesLeft: this.guardianTriesLeft(), power });
  }

  // ---------- açılımlar ve yükseltmeler ----------
  applyUnlockVisibility() {
    for (const s of this.stations) s.setVisible(s.unlocked);
    for (const c of this.counters) c.setVisible(c.unlocked);
    this.depot?.setVisible(this.depot.unlocked);
    const rv = this.region.layout.river;
    if (this.refs.bridge) this.refs.bridge.visible = this.unlocked.has(rv.bridge);
  }

  unlock(id) {
    if (this.unlocked.has(id)) return;
    this.unlocked.add(id);
    this.applyUnlockVisibility();
    const def = this.region.unlocks.find((u) => u.id === id);
    const targets = [];
    for (const s of this.stations) if (s.def.requires === id) targets.push(s.model);
    for (const c of this.counters) if (c.def.requires === id) targets.push(c.model);
    if (this.region.layout.river?.bridge === id) targets.push(this.refs.bridge);
    for (const o of targets) { o.scale.setScalar(0.01); this.pops.push({ o, t: 0 }); }
    this.fx.confetti(this.pad(id).mesh.position.clone().setY(0.5));
    sfx.unlock2();
    this.ui.toast(L(`${def.name} açıldı!`, `${def.name} unlocked!`));
    this.ui.refreshUpgrades();
    this.save();
  }

  canUpgrade(u) {
    if (u.requires && !this.unlocked.has(u.requires)) return false;
    return this.levels[u.id] < u.max;
  }

  costOf(u) {
    // Sadık Cüce mührü: bölgedeki ilk işçi bedava
    if (u.worker && this.workers.length === 0 && this.profile.meta('freeWorker')) return 0;
    return upgradeCost(u, this.levels[u.id]);
  }

  buyUpgrade(id) {
    const u = this.upgrades.find((x) => x.id === id);
    if (!this.canUpgrade(u)) return false;
    const cost = this.costOf(u);
    if (this.gold < cost) { sfx.deny(); return false; }
    this.gold -= cost;
    this.levels[id]++;
    this.ui.setGold(this.gold);
    sfx.buy();
    if (u.worker) this.spawnWorker(id);
    this.refreshPlayerStats();
    for (const w of this.workers) w.refreshStats();
    this.save();
    return true;
  }

  refreshPlayerStats() {
    this.player.speed = stats.speed(this.levels.speed) * (1 + 0.1 * this.profile.meta('boots'));
    this.player.stack.cap = stats.capacity(this.levels.capacity);
  }

  spawnWorker(roleId, silent = false) {
    const role = this.region.workers.find((w) => w.id === roleId);
    const idx = this.workers.filter((w) => w.role.id === roleId).length;
    const w = new Worker(this, role, idx);
    w.refreshStats();
    this.workers.push(w);
    if (!silent) {
      this.fx.confetti(w.pos.clone().setY(1));
      this.ui.toast(L(`${role.name} işe başladı!`, `${role.name} hired!`));
    }
  }

  // ---------- işçi planlayıcı ----------
  destFor(type, from) {
    const st = this.stations.filter((s) => s !== from && s.unlocked && s.accepts(type) && !s.inputs[type].full);
    const ratio = (s) => s.inputs[type].total / s.inputs[type].cap;
    st.sort((a, b) => ratio(a) - ratio(b));
    const counter = this.counters.find((c) => c.unlocked && c.accepts.includes(type) && !c.shelf.full);
    const orderWants = this.orderRemaining(type) > 0;
    const isExport = type === this.region.exports;
    // sipariş ya da kervan (bölgenin malı); siparişte varsa önce sipariş
    const royal = orderWants ? this.chest : isExport ? this.caravan : null;
    // ara ürün de siparişteyse (ör. altın varak) bir kısmı atölye yerine sandığa gider
    if (royal && st.length && Math.random() < 0.3) return royal;
    if (st.length && ratio(st[0]) < 0.5) return st[0];
    // tezgahta birkaç tane varsa ya da kabaca her üç seferden birinde krala götür
    if (royal && (!counter || counter.shelf.count(type) >= 2 || Math.random() < 0.35)) return royal;
    if (counter) return counter;
    if (royal) return royal;
    return st[0] || null;
  }

  plan(w) {
    // elinde eşya varsa önce onu bırak
    if (w.stack.total > 0) {
      const type = w.stack.items[w.stack.total - 1].type;
      const dst = this.destFor(type);
      return dst ? { src: null, dst, type } : null;
    }
    const role = w.role;
    if (role.node) {
      const node = this.node(role.node);
      if (!node.active) return null;
      const dst = this.destFor(node.type);
      return dst ? { src: node, dst, type: node.type } : null;
    }
    if (role.hauler) {
      let best = null, bestN = 0;
      for (const s of this.depot?.unlocked ? [...this.stations, this.depot] : this.stations) {
        if (!s.unlocked || s.output.total <= bestN) continue;
        const out = s.recipe ? s.recipe.out : s.type;
        const dst = this.destFor(out, s);
        if (dst) { best = { src: s, dst, type: out }; bestN = s.output.total; }
      }
      return best;
    }
    return null;
  }

  // ---------- oyuncu etkileşimi ----------
  interactPlayer(dt) {
    const p = this.player;
    p.working = false;
    for (const n of this.nodes) {
      if (n.active && p.near(n.zone, n.r)) {
        if (!n.gather(p, dt, stats.gather(this.levels.gather))) this.flashFull();
      }
    }
    p.xferT += dt;
    if (p.xferT >= XFER) {
      p.xferT = 0;
      for (const s of this.stations) {
        if (!s.unlocked || !p.near(s.zone, s.r)) continue;
        if (s.tryDrop(p)) sfx.drop();
        else if (s.tryPick(p)) sfx.pop(p.stack.total);
        else if (p.stack.full && s.output.total > 0) this.flashFull();
      }
      for (const c of this.counters) {
        if (!c.unlocked) continue;
        if (p.near(c.zone, c.r) && c.tryDrop(p)) sfx.drop();
        if (p.near(c.coinPos, 1.1)) this.collectCoins(c);
      }
      if (p.near(this.chest.zone, this.chest.r)) this.chest.tryDrop(p);
      if (p.near(this.caravan.zone, this.caravan.r)) this.caravan.tryDrop(p);
      if (this.depot?.unlocked && p.near(this.depot.zone, this.depot.r) && this.depot.tryPick(p)) sfx.pop(p.stack.total);
    }
    for (const pad of this.pads) pad.update(dt);
    this.fullBubble.show(p.stack.full);
  }

  flashFull() {
    if (this.fullT > 0) return;
    this.fullT = 1.2;
    this.ui.floater(this.player.char, L('DOLU!', 'FULL!'), 'full');
  }

  collectCoins(c) {
    for (let i = 0; i < 4 && c.coins.total > 0; i++) {
      const it = c.coins.take();
      const v = it.value || 0;
      vanishFollow(it.mesh, this.player.char, () => {
        this.gold += v;
        this.ui.setGold(this.gold);
      });
      this.collectAcc += v;
      this.collectT = 0.35;
      this.stat('collected', v);
      sfx.coin();
    }
  }

  // ---------- öğretici rehber ----------
  makeGuide() {
    this.TUT = this.region.tutorial(this).map((st) => ({ ...st, text: T(st.text) }));
    // tamamlanmış bir bölgeye dönüldüyse öğreticiyi atla
    if (this.rs.level > 0 || this.workers.length) this.rs.tut = this.TUT.length;

    const arrow = new THREE.Group();
    const m = mat(0xffd84a, { emissive: 0xffa800, emissiveIntensity: 0.6 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 4), m);
    cone.rotation.x = Math.PI; cone.position.y = 0.35;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.6, 0.26), m);
    shaft.position.y = 0.95;
    arrow.add(cone, shaft);
    this.scene.add(arrow);
    this.arrow = arrow;

    const ptr = new THREE.Mesh(
      new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.55), new THREE.Vector2(0.35, 0), new THREE.Vector2(0, 0.15), new THREE.Vector2(-0.35, 0)])).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    );
    ptr.renderOrder = 3;
    this.scene.add(ptr);
    this.pointer = ptr;
  }

  updateGuide(dt) {
    const rs = this.rs;
    while (rs.tut < this.TUT.length && this.TUT[rs.tut].done()) {
      rs.tut++;
      if (rs.tut < this.TUT.length) sfx.buy();
      this.save();
    }
    const step = this.TUT[rs.tut];
    let at = step?.at() ?? null;
    if (!step) {
      // öğretici bitti: ödenebilir inşa alanı ya da sipariş için elinde ürün varsa sandığı göster
      const pad = this.pads.find((p) => p.visible && this.gold >= p.remaining * 0.6);
      const carriesOrder = this.player.stack.items.some((it) => this.orderRemaining(it.type) > 0);
      at = pad ? pad.pos : carriesOrder ? this.chest.zone : this.guardianReady() ? this.arena.zone : null;
    }
    if (step) this.ui.objective(step.text, rs.tut, this.TUT.length);
    else if (this.guardianReady()) {
      // 3. sipariş bitti: sıradaki bölgeye geçmek için bekçi yenilmeli
      const gd = this.region.guardian;
      this.ui.objective(this.canWin()
        ? L(`Ordun hazır! Arenaya git ve ${gd.name}'e saldır`, `Your army is ready! Go to the arena and attack the ${gd.name}`)
        : L(`${gd.name}'i yenmek için ordunu güçlendir (arena ya da Lonca → Ordu)`, `Strengthen your army to defeat the ${gd.name} (arena or Guild → Army)`), 0, 0, '⚔');
    } else this.ui.objective(null);
    const t = performance.now() * 0.004;
    this.arrow.visible = !!at;
    this.pointer.visible = false;
    if (!at) return;
    this.arrow.position.set(at.x, 2.6 + Math.sin(t) * 0.25, at.z);
    this.arrow.rotation.y += dt * 2;
    const p = this.player.pos;
    if (flat(p, at) > 3) {
      this.pointer.visible = true;
      const a = Math.atan2(at.x - p.x, at.z - p.z);
      this.pointer.position.set(p.x + Math.sin(a) * 1.3, 0.06, p.z + Math.cos(a) * 1.3);
      this.pointer.rotation.y = a;
    }
  }

  // ---------- kervanlar: bölgenin malını başkente götüren, başka bölgelerden mal getiren arabalar ----------
  updateCaravans(dt) {
    const roadZ = this.region.layout.roadZ;
    this.caravanT -= dt;
    if (this.caravanT <= 0) {
      this.caravanT = 28 + Math.random() * 24;
      const incoming = this.depot?.unlocked && Math.random() < 0.5;
      const cargo = incoming ? this.depot.type : this.region.exports;
      const w = makeWagon(this.rs.level > 0 || incoming ? cargo : null);
      const dir = incoming ? 1 : -1;
      w.position.set(-dir * 30, 0, roadZ + (incoming ? -0.7 : 0.7));
      w.rotation.y = dir > 0 ? 0 : Math.PI;
      this.scene.add(w);
      this.caravans.push({ w, dir });
    }
    for (let i = this.caravans.length - 1; i >= 0; i--) {
      const c = this.caravans[i];
      c.w.position.x += c.dir * 3.2 * dt;
      c.w.userData.body.position.y = Math.abs(Math.sin(this.time * 8)) * 0.04;
      if (Math.abs(c.w.position.x) > 31) { c.w.removeFromParent(); this.caravans.splice(i, 1); }
    }
  }

  // ---------- ana güncelleme ----------
  update(dt, input) {
    this.time += dt;
    this.rs.playSec = (this.rs.playSec || 0) + dt;
    const p = this.player;
    if (this.bot) this.bot.update(dt); // denge simülasyonu
    else p.move(input.x, input.z, dt);
    this.interactPlayer(dt);
    p.updateVisual(dt);

    for (const n of this.nodes) n.update(dt);
    for (const s of this.stations) s.update(dt);
    for (const c of this.counters) c.update(dt);
    for (const w of this.workers) w.update(dt);
    this.chest.update(dt, this.time);
    this.depot?.update(dt);
    this.arena.update(dt);
    this.updateCaravans(dt);
    for (const sp of this.refs.spinners || []) sp.obj.rotation[sp.axis] += sp.speed * dt;
    for (const b of this.refs.banners || []) b.userData.flag.rotation.y = Math.sin(this.time * 2 + b.position.x) * 0.25;
    this.region.update?.(this, dt);
    for (const t of this.refs.torches || []) {
      const f = 1 + Math.sin(this.time * 13 + t.position.x) * 0.12;
      t.userData.flame.scale.set(1, f, 1);
    }

    for (const { s, b } of this.stationBubbles) {
      const show = s.unlocked && flat(s.zone, p.pos) < 7.5;
      b.show(show);
      if (show) b.set(this.ui.stationHTML(s));
    }

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const q = this.pops[i];
      q.t += dt / 0.6;
      const k = Math.min(1, q.t);
      const e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k) * Math.cos(k * Math.PI * 3.5);
      q.o.scale.setScalar(Math.max(0.01, e));
      if (k >= 1) this.pops.splice(i, 1);
    }

    updateVanishing(dt);
    this.fx.update(dt);
    this.updateGuide(dt);

    if (this.collectT > 0) {
      this.collectT -= dt;
      if (this.collectT <= 0 && this.collectAcc > 0) {
        this.ui.floater(p.char, `+${this.collectAcc}`, 'gold');
        this.collectAcc = 0;
      }
    }

    // başkente pasif kervan akışı
    this.exportT += dt;
    if (this.exportT >= 1) {
      this.profile.tickExports(this.exportT);
      this.exportT = 0;
      this.ui.setOrder(this.orderView());
    }

    this.fullT = Math.max(0, this.fullT - dt);
    this.saveT += dt;
    if (this.saveT > 4) { this.saveT = 0; this.save(); }
    this.ui.setUpgradeBadge(this.upgrades.some((u) => this.canUpgrade(u) && this.gold >= this.costOf(u))
      || (this.guardianReady() && this.guardianTriesLeft() > 0 && this.canWin()));
  }
}
export { Worker, GatherNode };
