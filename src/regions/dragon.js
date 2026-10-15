// Bölge 6: Ejderha Dağı. Ejderha uyurken inindeki pulları topla; uyanınca kaç, yoksa yükünün bir kısmı yanar.
// Başkente Ejderha Ateşi gönderir.
import * as THREE from 'three';
import { makeDragon } from '../models.js';
import { sfx } from '../audio.js';

const LAIR = new THREE.Vector3(-2, 0, -13.5);
const SLEEP = [16, 24], WARN = 2.5, AWAKE = 6;

export default {
  id: 'dragon',
  name: 'Ejderha Dağı',
  icon: 'fire',
  map: { x: 72, y: 16 },
  intro: 'Ejderha uyurken pullarını topla, uyanınca inden uzaklaş. Lavla ejderha ateşi damıt.',
  exports: 'dragonfire',
  startGold: 0,
  theme: { grass: [0x5a4a42, 0x4e403a, 0x665248], dirt: 0x6a5446, dirtDark: 0x4a3a32, sky: 0x9a6a58, road: 0x5a4a40, border: 'rocks', floor: 'ash', backdrop: 'volcano' },
  light: { hemi: 0.95, sun: 0.9, exposure: 1.0 },

  layout: {
    bounds: { minX: -15, maxX: 15, minZ: -21, maxZ: 17 },
    spawn: [0, 3],
    roadZ: 19,
    tavern: [13, 4, -Math.PI / 2],
    tavernDoor: [10.9, 4],
    dirt: [[26, 22, 0, 1.5], [8, 7, -2, -14.5, 1]],
  },

  nodes: [
    { id: 'lava', type: 'lava', label: 'LAV', zone: [9, -9], r: 2.1, visual: 'lava', speck: 0xff6a1a },
    { id: 'lair', type: 'scale', label: 'İN', zone: [LAIR.x, LAIR.z], r: 2.2, visual: 'scales', speck: 0x2f7a5a, hazard: true },
  ],

  stations: [
    { id: 'forge', model: 'obsidian', label: 'LAV OCAĞI', pos: [2, -5], zone: [2, -2.6], r: 1.5,
      recipe: { in: { lava: 2, scale: 1 }, out: 'dragonfire', time: 9 } },
    { id: 'shieldsmith', model: 'scalepress', label: 'PUL PRESİ', pos: [-8, 0], zone: [-8, 2.2], r: 1.4, requires: 'shieldsmith',
      recipe: { in: { scale: 2, steel: 1 }, out: 'dragonshield', time: 5 } },
  ],

  counters: [
    { id: 'market', label: 'SİMYACI', icon: 'scale', pos: [-7, 11], zone: [-7, 9.4], coins: [-10.2, 10.4], canopy: 'purple',
      customers: [{ look: 'merchant', wants: 'scale', need: [1, 3] }, { look: 'wizard', wants: 'dragonfire', need: [1, 1] }] },
    { id: 'slayers', label: 'AVCI', icon: 'dragonshield', pos: [7, 11], zone: [7, 9.4], coins: [10.2, 10.4], canopy: 'red', requires: 'shieldsmith',
      customers: [{ look: 'slayer', wants: 'dragonshield', need: [1, 1] }] },
  ],

  chest: { pos: [0, 10.6], zone: [0, 8.9], r: 1.25 },

  // Krallık Ambarı'ndan kervanla gelen mal (kalkanın çelik çerçevesi)
  depot: { type: 'steel', pos: [-11.5, 6], requires: 'shieldsmith' },

  unlocks: [
    { id: 'shieldsmith', name: 'Pul Presi & Avcı Tezgahı', cost: 18000, pos: [-8, 0] },
  ],

  workers: [
    { id: 'lavaMiner', name: 'Lavcı Cüce', icon: 'lava', look: 'dwarf-coal', node: 'lava', base: 700 },
    { id: 'scaler', name: 'Pul Toplayıcı', icon: 'scale', look: 'dwarf-lumber', node: 'lair', base: 1000 },
    { id: 'hauler', name: 'Çırak', icon: 'dragonfire', look: 'apprentice', hauler: true, base: 2600 },
  ],

  // Son bölgenin bekçisi: yenilince Ejderha Dağı tamamen fethedilir (büyük mühür ödülü)
  guardian: {
    name: 'Magma Titanı', icon: 'magma', power: 3200,
    story: 'Volkanın kalbinde uyuyan Magma Titanı uyandı. Onu yenen krallık dağın tamamına sahip olur.',
  },
  army: [
    { id: 'lavaguard', name: 'Lav Muhafızı', icon: 'lava', base: 3000, power: 75 },
    { id: 'hunter', name: 'Ejder Avcısı', icon: 'dragonshield', base: 12000, power: 320, requires: 'shieldsmith' },
    { id: 'fireknight', name: 'Ateş Şövalyesi', icon: 'dragonfire', base: 30000, power: 800, requires: 'shieldsmith' },
  ],
  colliders: [
    { box: [0.2, 3.8, -6.1, -4] },
    { box: [-9.5, -6.5, -1, 0.9], requires: 'shieldsmith' },
    { box: [-8.8, -5.2, 10.4, 11.6] },
    { box: [5.2, 8.8, 10.4, 11.6], requires: 'shieldsmith' },
    { box: [-0.8, 0.8, 10.1, 11.1] },
    { box: [11.4, 14.6, 1.9, 6.1] },
    { box: [-4.5, 0.5, -22, -18] },
    { box: [-12.8, -10.2, 5.1, 6.4], requires: 'shieldsmith' },
  ],

  orders: [{ scale: 380 }, { dragonfire: 130 }, { dragonfire: 220, dragonshield: 80 }],
  orderGrowth: 1.3,

  decor: [
    ['lavapool', -12, -8, 0, 1.6], ['lavapool', 13, -16, 0, 1.3], ['lavapool', -13, 12, 0, 1.1],
    ['rock', -8, -18, 0, 2.2], ['rock', 5, -19, 0, 2.6], ['rock', -12.5, -15, 0, 1.8], ['rock', 13, -3, 0, 1.6],
    ['torch', -0.6, -2.4], ['torch', 4.6, -2.4], ['barrel', 4.4, -6.2], ['crates', -12, 8.6, 1.1],
  ],

  tutorial: (g) => {
    const has = (t) => g.player.stack.count(t);
    const st = (k) => g.stats[k] || 0;
    return [
      { text: 'Lav tarlasından lav taşı topla', at: () => g.node('lava').zone, done: () => has('lava') >= 2 },
      { text: 'Ejderha uyurken ininden pul al', at: () => g.node('lair').zone, done: () => has('scale') >= 1 },
      { text: 'Lav ve pulu lav ocağına bırak', at: () => g.station('forge').zone, done: () => st('drop_forge') >= 3 },
      { text: 'Pulları Kraliyet Sandığına teslim et', at: () => g.chest.zone, done: () => g.deliveredTotal() >= 1 },
      { text: 'Pulları simyacıya sat', at: () => g.counter('market').zone, done: () => st('shelf_market') >= 1 },
      { text: 'Pul presini inşa et', at: () => g.pad('shieldsmith')?.pos, done: () => g.unlocked.has('shieldsmith') },
    ];
  },

  // ---------- ejderha ----------
  setup(g) {
    const model = makeDragon();
    model.position.set(-2, 0, -21);
    g.scene.add(model);
    g.hazard = { state: 'sleep', t: 12, danger: false, model, burned: false, fireT: 0, lift: 0 };
    g.hazard.bubble = g.ui.bubble(model.userData.head, 1.6, 'dragon');
  },

  update(g, dt) {
    const h = g.hazard;
    const u = h.model.userData;
    h.t -= dt;
    if (h.t <= 0) {
      if (h.state === 'sleep') { h.state = 'warn'; h.t = WARN; sfx.deny(); }
      else if (h.state === 'warn') { h.state = 'awake'; h.t = AWAKE; h.burned = false; }
      else { h.state = 'sleep'; h.t = SLEEP[0] + Math.random() * (SLEEP[1] - SLEEP[0]); }
    }
    h.danger = h.state === 'awake';

    // kafa kalkar, gözler parlar, uyurken nefes alır
    const target = h.state === 'sleep' ? 0 : h.state === 'warn' ? 0.6 : 1;
    h.lift += (target - h.lift) * Math.min(1, dt * 3);
    u.neck.rotation.x = 0.45 - h.lift * 0.75;
    u.neck.position.y = 1.6 + h.lift * 0.4;
    for (const e of u.eyes) e.material.emissiveIntensity = h.lift * 2.5;
    const breath = 1 + Math.sin(g.time * (h.state === 'sleep' ? 1.6 : 4)) * 0.03;
    u.body.scale.set(1.3 * breath, 0.8 * breath, 1.7);
    u.tail.rotation.y = Math.sin(g.time * (h.danger ? 3 : 0.7)) * 0.25;
    if (h.state === 'warn') h.model.position.x = -2 + Math.sin(g.time * 40) * 0.04;
    else h.model.position.x = -2;

    // ateş: ağızdan inin üstüne
    if (h.danger) {
      h.fireT -= dt;
      if (h.fireT <= 0) {
        h.fireT = 0.05;
        const from = u.mouth.getWorldPosition(new THREE.Vector3());
        const dir = new THREE.Vector3(LAIR.x - from.x, 0.4 - from.y, LAIR.z - from.z).normalize();
        g.fx.emit(from, { n: 3, color: Math.random() < 0.5 ? 0xff7a1a : 0xffd36a, glow: true, geo: 'ball', dir, speed: 9, spread: 2.2, life: 0.75, gravity: -1, scale: 0.55 });
      }
      // oyuncu indeyse yükünün bir kısmı yanar ve dışarı itilir
      const p = g.player;
      const d = Math.hypot(p.pos.x - LAIR.x, p.pos.z - LAIR.z);
      if (d < 2.8) {
        p.pos.z += dt * 6;
        if (!h.burned) {
          h.burned = true;
          let lost = 0;
          for (let i = 0; i < 3 && p.stack.total > 0; i++) {
            const it = p.stack.take();
            g.fx.sparks(it.mesh.position);
            it.mesh.removeFromParent();
            lost++;
          }
          g.ui.floater(p.char, lost ? `YANDIN! -${lost}` : 'YANDIN!', 'full');
          sfx.deny();
        }
      }
    }
    h.bubble.set(h.state === 'sleep' ? '💤' : h.state === 'warn' ? '⚠️ uyanıyor' : '🔥');
  },
};
