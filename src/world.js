// Dünya: bölge verisinden zemin, yollar, nehir, kaynak görselleri ve dekor kurulur.
import * as THREE from 'three';
import {
  C, mat, makeTree, makeRock, makeFence, makeTavern, makeCrateStack, makeBarrel, makeStump, makeMineEntrance, makeBridge,
  makeWall, makeTorch, makeCrystalCluster, makeSpring, makeLavaPool, makeSandMound, makeScalePile,
} from './models.js';
import { ICON_DRAW } from './icons.js';
import { makeFloor, buildBackdrop } from './scenery.js';
import { makeBanner, makeSignpost } from './machines.js';

export const v3 = ([x, z], y = 0) => new THREE.Vector3(x, y, z);

// Bölgenin çarpışma kutularını hazırlar. Nehir varsa köprü yapılana kadar geçit kapalıdır.
export function makeColliders(region) {
  const list = (region.colliders || []).map((c) => ({
    minX: c.box[0], maxX: c.box[1], minZ: c.box[2], maxZ: c.box[3], requires: c.requires, until: c.until,
  }));
  const rv = region.layout.river;
  if (rv) {
    const x0 = rv.x - rv.w / 2, x1 = rv.x + rv.w / 2;
    if (rv.bridgeZ == null) { list.push({ minX: x0, maxX: x1, minZ: -60, maxZ: 60 }); return list; }
    list.push({ minX: x0, maxX: x1, minZ: -60, maxZ: rv.bridgeZ - 1.2 });
    list.push({ minX: x0, maxX: x1, minZ: rv.bridgeZ + 1.2, maxZ: 60 });
    list.push({ minX: x0, maxX: x1, minZ: rv.bridgeZ - 1.2, maxZ: rv.bridgeZ + 1.2, until: rv.bridge });
  }
  return list;
}

export function collide(pos, r, colliders, bounds, unlocked) {
  for (const c of colliders) {
    if (c.requires && !unlocked.has(c.requires)) continue;
    if (c.until && unlocked.has(c.until)) continue;
    const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
    const dx = pos.x - cx, dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        pos.x = cx + (dx / d) * r;
        pos.z = cz + (dz / d) * r;
      } else {
        // kutunun içine düştüyse en yakın kenara it
        const opts = [[pos.x - c.minX, -1, 0], [c.maxX - pos.x, 1, 0], [pos.z - c.minZ, 0, -1], [c.maxZ - pos.z, 0, 1]];
        opts.sort((a, b) => a[0] - b[0]);
        pos.x += opts[0][1] * (opts[0][0] + r);
        pos.z += opts[0][2] * (opts[0][0] + r);
      }
    }
  }
  pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x));
  pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z));
}

function rngFrom(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const nearAny = (x, z, list, d) => list.some(([px, pz]) => Math.hypot(x - px, z - pz) < d);

export function buildWorld(scene, region) {
  const rng = rngFrom(region.id.length * 7 + 3);
  const L = region.layout;
  const T = region.theme;
  const rv = L.river;
  const inRiver = (x, pad = 1.6) => rv && Math.abs(x - rv.x) < rv.w / 2 + pad;
  const refs = { nodeVisuals: {}, bridge: null };

  // ---- zemin: hafif dalgalı renkli low-poly çim ----
  const g = new THREE.PlaneGeometry(64, 70, 40, 44).rotateX(-Math.PI / 2).toNonIndexed();
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cols = T.grass.map((c) => new THREE.Color(c));
  for (let i = 0; i < pos.count; i += 3) {
    const c = cols[Math.floor(rng() * cols.length)];
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  ground.position.z = -2;
  ground.receiveShadow = true;
  scene.add(ground);

  const flat = (w, d, m, x, z, y = 0.01) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), m);
    p.position.set(x, y, z);
    p.receiveShadow = true;
    scene.add(p);
    return p;
  };
  const dirt = mat(T.dirt, { roughness: 1 });
  const dirtDark = mat(T.dirtDark, { roughness: 1 });
  (L.dirt || []).forEach(([w, d, x, z, dark], i) => {
    // ilk alan bölgenin avlusu: temaya özgü dokulu zemin (taş, kum, kül...)
    if (i === 0 && T.floor) {
      const f = makeFloor(T.floor, w, d);
      f.position.set(x, 0.011, z);
      scene.add(f);
    } else flat(w, d, dark ? dirtDark : dirt, x, z, dark ? 0.012 : 0.01);
  });

  // ---- ana yol ve tezgah önü yolları ----
  flat(80, 3.4, mat(T.road || 0xa98a63, { roughness: 1 }), 0, L.roadZ, 0.013);
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.18 + rng() * 0.2, 6).rotateX(-Math.PI / 2), mat(0x8f7655));
    s.position.set(-30 + rng() * 60, 0.02, L.roadZ - 1.3 + rng() * 2.6);
    scene.add(s);
  }
  for (const c of region.counters) flat(2.4, 7, dirt, c.pos[0], 15.3, 0.011);

  // ---- nehir ----
  if (rv) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(rv.w + 0.4, 90).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x3f8fc4, roughness: 0.25, metalness: 0.1, emissive: 0x0a2a44 }),
    );
    water.position.set(rv.x, 0.02, 0);
    scene.add(water);
    for (const sx of [-1, 1]) flat(0.35, 90, mat(0x8a7a5c), rv.x + sx * (rv.w / 2 + 0.3), 0, 0.03);
    for (let i = 0; i < 26; i++) {
      const r = makeRock(0x7c7a74, 0.25 + rng() * 0.25);
      r.position.set(rv.x + (rng() < 0.5 ? -1 : 1) * (rv.w / 2 + 0.45), 0, -24 + rng() * 44);
      if ((rv.bridgeZ != null && Math.abs(r.position.z - rv.bridgeZ) < 2) || Math.abs(r.position.z - L.roadZ) < 2.2) continue;
      scene.add(r);
    }
    // yoldaki eski köprü (sadece görsel)
    const rb = makeBridge(rv.w);
    rb.position.set(rv.x, 0, L.roadZ);
    scene.add(rb);
    if (rv.bridgeZ != null) {
      refs.bridge = makeBridge(rv.w);
      refs.bridge.position.set(rv.x, 0, rv.bridgeZ);
      scene.add(refs.bridge);
    }
  }

  // ---- kaynak bölgeleri ----
  const keepClear = [...region.nodes.map((n) => n.zone), ...region.stations.map((s) => s.pos), ...region.counters.map((c) => c.pos)];
  for (const n of region.nodes) {
    const [zx, zz] = n.zone;
    const vis = [];
    const others = keepClear.filter(([x, z]) => x !== zx || z !== zz);
    const ring = (count, make, rx = 2.4, rz = 2.1, a0 = 0.3) => {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + a0;
        const o = make(i);
        o.position.set(zx + Math.cos(a) * rx, 0, zz + Math.sin(a) * rz);
        if (inRiver(o.position.x, 0.6)) continue;
        scene.add(o);
        vis.push(o);
      }
    };
    if (n.visual === 'crystals') {
      ring(5, () => makeCrystalCluster(n.color, 0.9 + rng() * 0.4));
    } else if (n.visual === 'spring') {
      const sp = makeSpring();
      sp.position.set(zx, 0, zz - 0.2);
      scene.add(sp);
      vis.push(sp);
    } else if (n.visual === 'lava') {
      const lp = makeLavaPool(1.1);
      lp.position.set(zx, 0, zz - 2.6);
      scene.add(lp);
      ring(4, () => makeRock(0x2a2220, 0.8 + rng() * 0.3, 0xff6a1a), 2.4, 2.1, 0.9);
    } else if (n.visual === 'mounds') {
      ring(4, () => makeSandMound(), 2.0, 1.8, 0.4);
    } else if (n.visual === 'scales') {
      ring(3, () => makeScalePile(), 1.7, 1.4, 0.2);
    } else if (n.visual === 'trees') {
      // arka plandaki orman
      for (let i = 0; i < 42; i++) {
        const x = zx - 7 + rng() * 13;
        const z = zz - 12 + rng() * 12;
        if (Math.hypot(x - zx, z - zz) < 2.7) continue;
        if (z > zz - 2.5 && Math.abs(x - zx) < 4) continue; // oyuncuyu kamera önünden kapatmasın
        if (inRiver(x) || nearAny(x, z, others, 3.4)) continue;
        const t = makeTree(rng, i);
        t.position.set(x, 0, z);
        scene.add(t);
      }
      // bölgenin yanında ve arkasında kesilebilir ağaçlar
      for (let i = 0; i < 4; i++) {
        const a = Math.PI + (i / 3) * Math.PI;
        const t = makeTree(rng, i * 3);
        t.position.set(zx + Math.cos(a) * 2.5, 0, zz + Math.sin(a) * 2.2);
        scene.add(t);
        vis.push(t);
      }
      for (let i = 0; i < 2; i++) {
        const s = makeStump();
        s.position.set(zx - 1 + rng() * 2, 0, zz - 1 + rng() * 2);
        scene.add(s);
      }
    } else {
      if (n.entrance) {
        const me = makeMineEntrance();
        me.position.set(n.entrance[0], 0, n.entrance[1]);
        scene.add(me);
      }
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        const r = makeRock(n.rock, 0.8 + rng() * 0.4, n.speck);
        r.position.set(zx + Math.cos(a) * 2.4, 0, zz + Math.sin(a) * 2.1);
        if (n.entrance && r.position.z < n.entrance[1] + 1.5 && Math.abs(r.position.x - n.entrance[0]) < 2) continue;
        if (inRiver(r.position.x, 0.6)) continue;
        scene.add(r);
        vis.push(r);
      }
      for (let i = 0; i < 6; i++) {
        const r = makeRock(C.stoneDark, 0.6 + rng() * 0.9);
        r.position.set(zx - 5 + rng() * 10, 0, zz - 6 - rng() * 4);
        if (inRiver(r.position.x)) continue;
        scene.add(r);
      }
    }
    refs.nodeVisuals[n.id] = vis;
  }

  // ---- kenar süsü ----
  const border = (i) => {
    if (T.border === 'rocks') return makeRock(i % 3 ? 0x4e403a : 0x3a302c, 1 + rng() * 1.4, i % 4 ? null : 0xff6a1a);
    if (T.border === 'crystals') return i % 3 ? makeRock(0x34313f, 1 + rng() * 1.3) : makeCrystalCluster(i % 2 ? 0x9a7aff : 0x4fc3ff, 1.2);
    return makeTree(rng, i);
  };
  for (let i = 0; i < 70; i++) {
    const side = i % 3;
    let x, z;
    if (side === 0) { x = -17 - rng() * 12; z = -26 + rng() * 44; }
    else if (side === 1) { x = 17 + rng() * 12; z = -26 + rng() * 44; }
    else { x = -28 + rng() * 56; z = -24 - rng() * 6; }
    if (inRiver(x)) continue;
    const t = border(i);
    t.position.set(x, 0, z);
    scene.add(t);
  }
  for (let i = 0; i < 30; i++) {
    const x = -30 + rng() * 60;
    if (inRiver(x)) continue;
    const t = border(i);
    t.position.set(x, 0, L.roadZ + 3 + rng() * 6);
    scene.add(t);
  }

  // ---- bölgenin arka planı ve krallığın ortak işaretleri ----
  refs.spinners = buildBackdrop(scene, region, rng);
  refs.banners = [];
  for (const x of [-2.6, 2.6]) {
    const b = makeBanner();
    b.position.set(x + (region.chest.pos[0] || 0), 0, 17.4);
    scene.add(b);
    refs.banners.push(b);
  }
  const sign = makeSignpost();
  sign.position.set(13.6, 0, 17.6);
  scene.add(sign);

  // ---- dekor ----
  if (L.tavern) {
    const tavern = makeTavern();
    tavern.position.set(L.tavern[0], 0, L.tavern[1]);
    tavern.rotation.y = L.tavern[2];
    scene.add(tavern);
  }
  refs.torches = [];
  const DECOR = {
    crates: () => makeCrateStack(),
    barrel: () => makeBarrel(),
    fence: (len) => makeFence(len || 8),
    wall: (len) => makeWall(len || 8),
    torch: () => { const t = makeTorch(); refs.torches.push(t); return t; },
    crystal: (len) => makeCrystalCluster(len || 0x9a7aff, 1.3),
    lavapool: (len) => makeLavaPool(len || 1.4),
    rock: (len) => makeRock(0x4e403a, len || 1.6),
  };
  for (const [kind, x, z, ry = 0, len] of region.decor || []) {
    const o = DECOR[kind](len);
    o.position.set(x, 0, z);
    o.rotation.y = ry;
    scene.add(o);
  }

  // çiçek ve çalı benekleri (oyun alanının dışında)
  const flowerCols = [0xf2d24a, 0xe86a8a, 0xffffff, 0x8a7ae8];
  const plants = T.border === undefined || T.border === 'trees';
  for (let i = 0; i < (plants ? 90 : 0); i++) {
    const x = -30 + rng() * 60, z = -25 + rng() * 44;
    if (Math.abs(x) < 13 && z > -9 && z < 13) continue;
    if (nearAny(x, z, keepClear, 2.5) || inRiver(x, 0.4)) continue;
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), mat(flowerCols[i % 4]));
    f.position.set(x, 0.1, z);
    scene.add(f);
  }
  for (let i = 0; i < (plants ? 26 : 0); i++) {
    const x = -30 + rng() * 60, z = -25 + rng() * 44;
    if (Math.abs(x) < 14 && z > -10 && z < 17) continue;
    if (nearAny(x, z, keepClear, 3) || inRiver(x)) continue;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), mat(i % 2 ? C.leaf2 : C.leaf));
    b.position.set(x, 0.25, z); b.scale.y = 0.7; b.castShadow = true;
    scene.add(b);
  }

  return refs;
}

// ---------- Zemindeki bölge işaretleri ----------
export function makeDecal(label, iconName, { w = 2.6, d = 2.6, round = false, color = '#ffffff' } = {}) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = Math.round(S * (d / w));
  const g = c.getContext('2d');
  const H = c.height;
  g.strokeStyle = color;
  g.fillStyle = 'rgba(255,255,255,0.16)';
  g.lineWidth = 12;
  g.setLineDash([26, 16]);
  if (round) {
    g.beginPath(); g.ellipse(S / 2, H / 2, S / 2 - 10, H / 2 - 10, 0, 0, Math.PI * 2);
  } else {
    const r = 34, x = 10, y = 10, ww = S - 20, hh = H - 20;
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath();
  }
  g.fill(); g.stroke();
  g.setLineDash([]);
  if (iconName && ICON_DRAW[iconName]) {
    g.save();
    g.globalAlpha = 0.9;
    g.translate(S / 2 - 42, H / 2 - 62);
    g.scale(0.88, 0.88);
    ICON_DRAW[iconName](g);
    g.restore();
  }
  if (label) {
    g.font = '30px "Lilita One", "Arial Black", sans-serif';
    g.textAlign = 'center';
    g.lineWidth = 7;
    g.strokeStyle = 'rgba(40,24,12,0.75)';
    g.strokeText(label, S / 2, H / 2 + 62);
    g.fillStyle = '#fff';
    g.fillText(label, S / 2, H / 2 + 62);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.y = 0.03;
  m.renderOrder = 1;
  return m;
}
