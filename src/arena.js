// Bölge bekçisinin arenası: zincirli canavar, askerlerin dünyadaki figürleri ve savaş.
// Her asker türü açıldığında dünyada bir figür olarak belirir; seviye atladıkça vuruşu güçlenir
// (her 10 seviyede bir figür daha katılır, en fazla 3). Saldırıda askerler arenaya yürür ve
// FIGHT_TIME saniye boyunca canavara vurur; canı bitmezse canavar iyileşir ve ordu geri çekilir.
import * as THREE from 'three';
import { makeGuardian, animateGuardian, makeArena, makeChain } from './monsters.js';
import { makeCharacter, animateCharacter, makeItem } from './models.js';
import { makeDecal, v3 } from './world.js';
import { ITEMS, FIGHT_TIME } from './config.js';
import { sfx } from './audio.js';

const tmp = new THREE.Vector3();
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fmtN = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n)));

export class Arena {
  constructor(game) {
    const def = game.region.guardian;
    this.g = game;
    this.def = def;
    this.center = v3(def.arena);
    // canavar ve askerler haritanın ortasına (atölyelere) bakar
    this.face = Math.atan2(-this.center.x, -this.center.z);
    const fx = Math.sin(this.face), fz = Math.cos(this.face);
    this.dir = new THREE.Vector3(fx, 0, fz);

    this.group = makeArena(3.2);
    this.group.position.copy(this.center);
    game.scene.add(this.group);

    this.boss = makeGuardian(def.model);
    this.boss.position.copy(this.center);
    this.boss.rotation.y = this.face;
    game.scene.add(this.boss);

    // direklerden canavarın gövdesine zincirler
    this.chains = this.group.userData.posts.map((p) => {
      const from = p.clone().add(this.center);
      const to = this.center.clone().add(new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(0.8)).setY(1.7);
      const c = makeChain(from, to);
      game.scene.add(c);
      return c;
    });

    // girişteki alan: üstüne gelince Ordu paneli açılır
    this.zone = this.center.clone().addScaledVector(this.dir, 4.7);
    this.r = 1.1;
    this.decal = makeDecal('ORDU', 'army', { w: 2.2, d: 1.6, color: '#ff8a7a' });
    this.decal.position.set(this.zone.x, 0.03, this.zone.z);
    game.scene.add(this.decal);
    this.inZone = false;

    this.collider = { minX: this.center.x - 1.1, maxX: this.center.x + 1.1, minZ: this.center.z - 1.1, maxZ: this.center.z + 1.1 };
    game.colliders.push(this.collider);

    this.bubble = game.ui.bubble(this.boss, 4.9, 'boss');
    this.figs = [];
    this.levelBubbles = {};
    this.state = game.rs.guardianDefeated ? 'dead' : 'idle';
    this.hp = def.hp;
    this.t = 0;
    this.floatT = 0;
    this.time = 0;
    if (this.state === 'dead') this.setDefeated(true);
  }

  // ---------- askerler ----------
  figureCount(level) { return level <= 0 ? 0 : Math.min(3, 1 + Math.floor(level / 10)); }

  syncSoldiers() {
    const g = this.g;
    for (const u of g.region.army) {
      const lvl = g.armyCount(u.id);
      const want = this.figureCount(lvl);
      const have = this.figs.filter((f) => f.unit === u);
      for (let i = have.length; i < want; i++) {
        const ch = makeCharacter(u.look || 'soldier');
        const weapon = makeItem(ITEMS[u.icon] ? u.icon : 'sword');
        weapon.rotation.set(0, -Math.PI / 2, 0); // bıçak ileri baksın
        weapon.position.set(0, -0.5, 0.05);
        ch.userData.armR.add(weapon);
        const f = { unit: u, ch, hitT: Math.random(), arrived: false };
        g.scene.add(ch);
        this.figs.push(f);
        // ilk figür formasyondaki yerinde belirir
        const spot = this.spot(this.figs.length - 1, this.figs.length, 4.0);
        ch.position.copy(spot);
        g.fx.confetti(spot.clone().setY(1));
      }
      if (want > 0) {
        if (!this.levelBubbles[u.id]) this.levelBubbles[u.id] = g.ui.bubble(this.figs.find((f) => f.unit === u).ch, 2.3, 'lvl');
        this.levelBubbles[u.id].set(`Sv.${lvl}`);
      }
    }
  }

  // formasyon (r 4.4) ya da saldırı (r 1.9) noktası: canavarın atölyelere bakan tarafında yay şeklinde
  spot(i, n, r) {
    const spread = r > 3 ? 0.26 : 0.55;
    const a = this.face + (i - (n - 1) / 2) * spread;
    return new THREE.Vector3(this.center.x + Math.sin(a) * r, 0, this.center.z + Math.cos(a) * r);
  }

  figDps(f) {
    const lvl = this.g.armyCount(f.unit.id);
    return (lvl * f.unit.dps) / this.figureCount(lvl);
  }

  // ---------- savaş ----------
  startFight() {
    this.state = 'fight';
    this.t = 0;
    this.hp = this.def.hp;
    for (const f of this.figs) { f.arrived = false; f.hitT = Math.random() * 0.4; }
    sfx.deny();
  }

  setDefeated(instant) {
    this.state = instant ? 'dead' : 'dying';
    this.deathT = 0;
    for (const c of this.chains) c.visible = false;
    const i = this.g.colliders.indexOf(this.collider);
    if (i >= 0) this.g.colliders.splice(i, 1);
    if (instant) this.boss.visible = false;
  }

  update(dt) {
    const g = this.g;
    this.time += dt;
    const fighting = this.state === 'fight';

    // canavar
    if (this.state === 'dying') {
      this.deathT += dt;
      const k = Math.min(1, this.deathT / 1.6);
      this.boss.rotation.x = -k * 1.3;
      this.boss.position.y = -k * 1.5;
      this.boss.userData.flash = 1 - k;
      if (k >= 1) { this.state = 'dead'; this.boss.visible = false; }
    } else if (this.state !== 'dead') {
      animateGuardian(this.boss, dt, this.time, this.state);
    }

    // askerler: savaşta saldırı noktasına, değilse formasyona
    const n = this.figs.length;
    this.figs.forEach((f, i) => {
      const target = fighting ? this.spot(i, n, 1.95) : this.spot(i, n, 4.0);
      const ch = f.ch;
      const dx = target.x - ch.position.x, dz = target.z - ch.position.z;
      const d = Math.hypot(dx, dz);
      let moving = false;
      if (d > 0.1) {
        const s = Math.min(d, 3.6 * dt);
        ch.position.x += (dx / d) * s;
        ch.position.z += (dz / d) * s;
        ch.rotation.y = Math.atan2(dx, dz);
        moving = true;
      } else {
        ch.rotation.y = Math.atan2(this.center.x - ch.position.x, this.center.z - ch.position.z);
      }
      f.arrived = d < 0.3;
      const attacking = fighting && f.arrived;
      animateCharacter(ch, dt, moving, 0.8, attacking);
      if (attacking) {
        f.hitT -= dt;
        if (f.hitT <= 0) {
          const interval = 0.8 + Math.random() * 0.4;
          f.hitT = interval;
          const dmg = this.figDps(f) * interval; // gösterilen vuruş; can aşağıda sürekli düşer
          this.boss.userData.flash = 1;
          tmp.copy(this.center).addScaledVector(this.dir, 0.9).setY(1.6 + Math.random());
          g.fx.sparks(tmp);
          if (this.floatT <= 0) {
            this.floatT = 0.2;
            g.ui.floater(this.boss, `-${fmtN(dmg)}`, 'dmg');
            sfx.clang();
          }
        }
      }
    });
    this.floatT -= dt;

    if (fighting) {
      // süre askerler canavara ulaşınca başlar; can ordunun saniyelik vuruşuyla sürekli düşer
      const allIn = this.figs.every((f) => f.arrived);
      if (allIn) {
        this.t += dt;
        this.hp = Math.max(0, this.hp - g.armyDps() * dt);
      }
      if (this.hp < 1) { // yuvarlama payı
        this.hp = 0;
        this.setDefeated(false);
        g.fx.confetti(this.center.clone().setY(2));
        g.onGuardianResult(true);
      } else if (this.t >= FIGHT_TIME) {
        // süre doldu: canavar zincirlerini sarsar, iyileşir; ordu geri çekilir
        const left = this.hp;
        this.state = 'idle';
        this.hp = this.def.hp;
        g.onGuardianResult(false, left);
      }
    }

    // can barı
    const near = flat(g.player.pos, this.center) < 14;
    this.bubble.show(this.state !== 'dead' && this.state !== 'dying' && (near || fighting));
    if (this.bubble.visible) {
      const k = this.hp / this.def.hp;
      const timer = fighting ? `<em>${Math.ceil(FIGHT_TIME - this.t)} sn</em>` : '';
      this.bubble.set(`<b>${this.def.name}</b>${timer}<div class="hpbar"><i style="width:${(k * 100).toFixed(1)}%"></i><span>❤ ${fmtN(this.hp)} / ${fmtN(this.def.hp)}</span></div>`);
    }
    for (const b of Object.values(this.levelBubbles)) b.show(near || fighting);

    // giriş alanı: Ordu panelini aç
    this.decal.visible = this.state !== 'dead';
    const inZone = flat(g.player.pos, this.zone) < this.r;
    if (inZone && !this.inZone && !fighting && this.state !== 'dead') g.ui.openArmy();
    this.inZone = inZone;
  }
}
