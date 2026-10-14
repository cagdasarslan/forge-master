// Low-poly modeller tamamen kodla üretilir: eşyalar, karakterler, yapılar ve doğa.
import * as THREE from 'three';

const mats = {};
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!mats[key]) mats[key] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });
  return mats[key];
}

export const C = {
  wood: 0x8f5a2c, woodLight: 0xc58c4f, woodDark: 0x5a3519, plank: 0xb07a43,
  leaf: 0x58a23d, leaf2: 0x3f8a33, leaf3: 0x7cbb47,
  stone: 0x9a958e, stoneDark: 0x6a6560, rock: 0x7f7a74,
  ore: 0xd2753a, iron: 0xc9d1da, ironDark: 0x8994a0, coal: 0x2a2a2e,
  gold: 0xf2c230, red: 0xc23b30, blue: 0x3a5fb0, green: 0x4f8f45, purple: 0x6b3fa0,
  skin: 0xf0b98a, skinDark: 0xc98a5e, leather: 0x6b4226, cream: 0xf3e3c3,
  fire: 0xff8a2a,
  copper: 0xd9813a, tin: 0xdfe6ee, bronze: 0xc7843f,
};

const geo = {
  log: new THREE.CylinderGeometry(0.15, 0.15, 0.72, 7).rotateZ(Math.PI / 2),
  logEnd: new THREE.CylinderGeometry(0.12, 0.12, 0.735, 7).rotateZ(Math.PI / 2),
  ore: new THREE.DodecahedronGeometry(0.2, 0),
  oreSpeck: new THREE.OctahedronGeometry(0.075, 0),
  coal: new THREE.IcosahedronGeometry(0.17, 0),
  ingot: new THREE.CylinderGeometry(0.2, 0.27, 0.18, 4, 1).rotateY(Math.PI / 4).scale(1.5, 1, 0.75),
  blade: new THREE.BoxGeometry(0.62, 0.04, 0.1),
  guard: new THREE.BoxGeometry(0.06, 0.07, 0.32),
  grip: new THREE.BoxGeometry(0.18, 0.06, 0.06),
  shield: new THREE.CylinderGeometry(0.3, 0.3, 0.07, 10),
  shieldBoss: new THREE.CylinderGeometry(0.09, 0.09, 0.1, 8),
  torso: new THREE.CylinderGeometry(0.22, 0.17, 0.3, 7),
  pauldron: new THREE.SphereGeometry(0.1, 6, 4),
  coin: new THREE.CylinderGeometry(0.13, 0.13, 0.05, 10),
  shaft: new THREE.CylinderGeometry(0.035, 0.035, 0.95, 5).rotateZ(Math.PI / 2),
  spearTip: new THREE.ConeGeometry(0.07, 0.22, 4).rotateZ(-Math.PI / 2),
  helmet: new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
};

// ---------- Eşyalar ----------
export function makeItem(type) {
  const g = new THREE.Group();
  let m;
  switch (type) {
    case 'wood':
      g.add(sh(new THREE.Mesh(geo.log, mat(C.wood))));
      g.add(new THREE.Mesh(geo.logEnd, mat(C.woodLight)));
      g.children[0].position.y = g.children[1].position.y = 0.15;
      break;
    case 'ore':
    case 'copper':
    case 'tin': {
      const rock = type === 'ore' ? C.rock : type === 'copper' ? 0x8a6a55 : 0x8f949c;
      const sp = type === 'ore' ? C.ore : type === 'copper' ? C.copper : C.tin;
      m = sh(new THREE.Mesh(geo.ore, mat(rock)));
      m.position.y = 0.17; g.add(m);
      for (const [x, y, z] of [[0.12, 0.24, 0.08], [-0.1, 0.2, 0.12], [0.02, 0.33, -0.1]]) {
        const s = new THREE.Mesh(geo.oreSpeck, mat(sp, { emissive: type === 'tin' ? 0x30343a : 0x5a2000, metalness: type === 'tin' ? 0.6 : 0 }));
        s.position.set(x, y, z); g.add(s);
      }
      if (type === 'copper') {
        const v = new THREE.Mesh(geo.oreSpeck, mat(0x4fae8a));
        v.position.set(-0.05, 0.3, -0.13); g.add(v);
      }
      break;
    }
    case 'coal':
      m = sh(new THREE.Mesh(geo.coal, mat(C.coal, { roughness: 0.5 })));
      m.position.y = 0.15; g.add(m);
      break;
    case 'ingot':
    case 'bronze':
      m = sh(new THREE.Mesh(geo.ingot, mat(type === 'ingot' ? C.iron : C.bronze, { metalness: 0.65, roughness: 0.35 })));
      m.position.y = 0.09; g.add(m);
      break;
    case 'spear': {
      const s = sh(new THREE.Mesh(geo.shaft, mat(C.wood)));
      s.position.y = 0.05;
      const tip = new THREE.Mesh(geo.spearTip, mat(C.bronze, { metalness: 0.6, roughness: 0.35 }));
      tip.position.set(0.56, 0.05, 0);
      g.add(s, tip);
      break;
    }
    case 'helmet': {
      const h = sh(new THREE.Mesh(geo.helmet, mat(C.bronze, { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide })));
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.3), mat(C.red));
      crest.position.y = 0.22;
      g.add(h, crest);
      break;
    }
    case 'sword': {
      const blade = sh(new THREE.Mesh(geo.blade, mat(C.iron, { metalness: 0.7, roughness: 0.3 })));
      blade.position.set(0.08, 0.05, 0);
      const guard = new THREE.Mesh(geo.guard, mat(C.gold, { metalness: 0.6, roughness: 0.4 }));
      guard.position.set(-0.24, 0.05, 0);
      const grip = new THREE.Mesh(geo.grip, mat(C.leather));
      grip.position.set(-0.36, 0.05, 0);
      g.add(blade, guard, grip);
      break;
    }
    case 'shield': {
      const s = sh(new THREE.Mesh(geo.shield, mat(C.red)));
      s.position.y = 0.04;
      const b = new THREE.Mesh(geo.shieldBoss, mat(C.gold, { metalness: 0.6, roughness: 0.4 }));
      b.position.y = 0.06;
      g.add(s, b);
      break;
    }
    case 'armor': {
      const t = sh(new THREE.Mesh(geo.torso, mat(C.iron, { metalness: 0.6, roughness: 0.35 })));
      t.position.y = 0.16;
      const p1 = new THREE.Mesh(geo.pauldron, mat(C.ironDark, { metalness: 0.6, roughness: 0.35 }));
      p1.position.set(0.24, 0.28, 0);
      const p2 = p1.clone(); p2.position.x = -0.24;
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.3), mat(C.leather));
      belt.position.y = 0.06;
      g.add(t, p1, p2, belt);
      break;
    }
    case 'steel':
      m = sh(new THREE.Mesh(geo.ingot, mat(0x7d8a99, { metalness: 0.8, roughness: 0.25 })));
      m.position.y = 0.09; g.add(m);
      break;
    case 'steelsword': {
      const blade = sh(new THREE.Mesh(geo.blade, mat(0xa9c4e0, { metalness: 0.85, roughness: 0.2, emissive: 0x0a1a2a })));
      blade.position.set(0.08, 0.05, 0); blade.scale.set(1.15, 1, 1.1);
      const guard = new THREE.Mesh(geo.guard, mat(0x2f4f9a, { metalness: 0.5 }));
      guard.position.set(-0.28, 0.05, 0);
      const grip = new THREE.Mesh(geo.grip, mat(0x1e1e22));
      grip.position.set(-0.4, 0.05, 0);
      g.add(blade, guard, grip);
      break;
    }
    case 'sand':
      m = sh(new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe2c27a)));
      m.scale.y = 0.8; g.add(m);
      {
        const glint = new THREE.Mesh(geo.oreSpeck, mat(0xf2c230, { metalness: 0.6, emissive: 0x3a2800 }));
        glint.position.set(0.06, 0.15, 0.05);
        g.add(glint);
      }
      break;
    case 'nugget':
      m = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), mat(C.gold, { metalness: 0.8, roughness: 0.25, emissive: 0x4a3200 })));
      m.position.y = 0.1; m.scale.set(1.3, 0.8, 1); g.add(m);
      break;
    case 'goldleaf':
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), mat(i % 2 ? 0xf6d45a : C.gold, { metalness: 0.8, roughness: 0.2, emissive: 0x3a2800 }));
        l.position.y = 0.015 + i * 0.025; l.rotation.y = i * 0.25; if (i === 0) l.castShadow = true;
        g.add(l);
      }
      break;
    case 'crown': {
      const band = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 10, 1, true), mat(C.gold, { metalness: 0.8, roughness: 0.25, side: THREE.DoubleSide })));
      band.position.y = 0.07; g.add(band);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), mat(C.gold, { metalness: 0.8 }));
        p.position.set(Math.cos(a) * 0.19, 0.19, Math.sin(a) * 0.19); g.add(p);
      }
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), mat(C.red, { emissive: 0x6a1010 }));
      gem.position.set(0, 0.08, 0.2); g.add(gem);
      break;
    }
    case 'crystalore': {
      m = sh(new THREE.Mesh(geo.ore, mat(0x4a4458)));
      m.position.y = 0.15; g.add(m);
      for (const [x, z, r] of [[0.06, 0.04, 0.3], [-0.08, -0.03, -0.4]]) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 5), mat(0x9a7aff, { emissive: 0x4a2aa0, emissiveIntensity: 0.8 }));
        c.position.set(x, 0.3, z); c.rotation.z = r; g.add(c);
      }
      break;
    }
    case 'crystal':
      m = sh(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), mat(0xb59aff, { emissive: 0x6a3ae0, emissiveIntensity: 0.9, roughness: 0.2 })));
      m.position.y = 0.16; m.scale.y = 1.5; g.add(m);
      break;
    case 'mana': {
      const b = sh(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0x4fc3ff, { emissive: 0x1a6aa0, emissiveIntensity: 0.8, roughness: 0.15, transparent: true, opacity: 0.85 })));
      b.position.y = 0.14; g.add(b);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 6), mat(0xdfe6ee));
      neck.position.y = 0.3; g.add(neck);
      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 6), mat(C.wood));
      cork.position.y = 0.36; g.add(cork);
      break;
    }
    case 'staff': {
      const s = sh(new THREE.Mesh(geo.shaft, mat(0x5a3519)));
      s.position.y = 0.05; s.scale.x = 1.05; g.add(s);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), mat(0xb59aff, { emissive: 0x6a3ae0, emissiveIntensity: 1 }));
      orb.position.set(0.55, 0.06, 0); g.add(orb);
      break;
    }
    case 'lava':
      m = sh(new THREE.Mesh(geo.ore, mat(0x2a2220)));
      m.position.y = 0.16; g.add(m);
      for (const [x, y, z] of [[0.1, 0.22, 0.1], [-0.1, 0.18, 0.08], [0.02, 0.32, -0.1]]) {
        const s = new THREE.Mesh(geo.oreSpeck, mat(0xff6a1a, { emissive: 0xff4a00, emissiveIntensity: 1.2 }));
        s.position.set(x, y, z); g.add(s);
      }
      break;
    case 'scale':
      m = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 6), mat(0x2f7a5a, { metalness: 0.5, roughness: 0.3 })));
      m.position.y = 0.03; m.scale.z = 0.75; g.add(m);
      break;
    case 'dragonfire': {
      const jar = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.26, 8), mat(0x3a2a24)));
      jar.position.y = 0.13; g.add(jar);
      const fire = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 6), mat(0xff7a1a, { emissive: 0xff5000, emissiveIntensity: 1.5 }));
      fire.position.y = 0.36; g.add(fire);
      break;
    }
    case 'dragonshield': {
      const s = sh(new THREE.Mesh(geo.shield, mat(0x2f7a5a, { metalness: 0.5, roughness: 0.3 })));
      s.position.y = 0.04;
      const b = new THREE.Mesh(geo.shieldBoss, mat(0xff6a1a, { emissive: 0xff4a00 }));
      b.position.y = 0.06;
      g.add(s, b);
      break;
    }
    case 'coin':
      m = sh(new THREE.Mesh(geo.coin, mat(C.gold, { metalness: 0.75, roughness: 0.3, emissive: 0x3a2800 })));
      m.position.y = 0.025; g.add(m);
      break;
  }
  return g;
}

export function sh(m, receive = false) {
  m.castShadow = true;
  m.receiveShadow = receive;
  return m;
}

export function box(w, h, d, color, x = 0, y = 0, z = 0, o) {
  const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, o)), true);
  m.position.set(x, y, z);
  return m;
}
export function cyl(rt, rb, h, seg, color, x = 0, y = 0, z = 0, o) {
  const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, o)), true);
  m.position.set(x, y, z);
  return m;
}

// ---------- Karakterler ----------
// look: player | dwarf-lumber | dwarf-miner | dwarf-coal | apprentice | merchant | knight | soldier | guard
const LOOKS = {
  player:     { body: C.leather, apron: 0x3d2a1c, legs: 0x4a3426, skin: C.skin, hair: 0x3a2414, beard: 0x3a2414, hat: null, scale: 1 },
  'dwarf-lumber': { body: 0xb83a2e, legs: 0x3b4a5c, skin: C.skin, beard: 0xd07a2c, hat: 'cap', hatColor: 0x2f6b34, scale: 0.78 },
  'dwarf-miner':  { body: 0x55606e, legs: 0x3b3128, skin: C.skin, beard: 0xe9e2d0, hat: 'mining', hatColor: 0xe0b52a, scale: 0.78 },
  'dwarf-coal':   { body: 0x3a3a40, legs: 0x2a2a2e, skin: C.skinDark, beard: 0x1e1e22, hat: 'mining', hatColor: 0x8a8f96, scale: 0.78 },
  apprentice: { body: 0x4f7fbf, apron: 0x6b4226, legs: 0x4a3426, skin: C.skin, hair: 0xc9852e, hat: null, scale: 0.88 },
  merchant:   { body: 0x3e8b4f, legs: 0x5a4632, skin: C.skinDark, hair: 0x2a1a10, hat: 'hat', hatColor: 0x7a2e6b, scale: 0.95 },
  knight:     { body: 0x2f4f9a, legs: 0x8994a0, skin: C.skin, hat: 'helmet', hatColor: C.iron, tabard: C.gold, scale: 1 },
  soldier:    { body: 0xa8322a, legs: 0x5a4632, skin: C.skin, hat: 'kettle', hatColor: C.ironDark, scale: 0.97 },
  legionary:  { body: 0xb5332a, legs: 0x6b4a2a, skin: C.skinDark, hat: 'kettle', hatColor: 0xc7843f, scale: 0.97 },
  centurion:  { body: 0x8f2420, legs: 0xc7843f, skin: C.skin, hat: 'crest', hatColor: 0xc7843f, tabard: 0xc7843f, scale: 1.04 },
  noble:      { body: 0x6b2a8a, legs: 0x2a1a3a, skin: C.skin, hat: 'crown', hatColor: C.gold, tabard: 0xf3e3c3, scale: 1.02 },
  wizard:     { body: 0x2f3f8a, legs: 0x2f3f8a, skin: C.skin, beard: 0xe9e2d0, hat: 'wizard', hatColor: 0x2f3f8a, scale: 1 },
  slayer:     { body: 0x3a3a40, legs: 0x5a4632, skin: C.skinDark, hat: 'helmet', hatColor: 0x2f7a5a, tabard: 0xff6a1a, scale: 1.08 },
  guard:      { body: C.purple, legs: C.ironDark, skin: C.skin, hat: 'crest', hatColor: C.gold, tabard: C.gold, scale: 1.05 },
};

export function makeCharacter(lookId) {
  const L = LOOKS[lookId];
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const dwarf = lookId.startsWith('dwarf');

  const legL = new THREE.Group(); legL.position.set(-0.13, 0.5, 0);
  const legR = new THREE.Group(); legR.position.set(0.13, 0.5, 0);
  legL.add(box(0.16, 0.5, 0.18, L.legs, 0, -0.25, 0));
  legR.add(box(0.16, 0.5, 0.18, L.legs, 0, -0.25, 0));
  legL.add(box(0.18, 0.1, 0.26, 0x3a2414, 0, -0.47, 0.04));
  legR.add(box(0.18, 0.1, 0.26, 0x3a2414, 0, -0.47, 0.04));
  body.add(legL, legR);

  const torso = cyl(0.27, 0.3, 0.62, 8, L.body, 0, 0.8, 0);
  body.add(torso);
  if (L.apron) body.add(box(0.42, 0.5, 0.06, L.apron, 0, 0.74, 0.27));
  if (L.tabard) body.add(box(0.3, 0.5, 0.05, L.tabard, 0, 0.78, 0.29));
  body.add(box(0.6, 0.08, 0.6, 0x3a2414, 0, 0.56, 0)); // kemer

  const armL = new THREE.Group(); armL.position.set(-0.36, 1.05, 0);
  const armR = new THREE.Group(); armR.position.set(0.36, 1.05, 0);
  armL.add(box(0.14, 0.46, 0.16, L.body, 0, -0.2, 0)); armL.add(box(0.14, 0.12, 0.14, L.skin, 0, -0.47, 0));
  armR.add(box(0.14, 0.46, 0.16, L.body, 0, -0.2, 0)); armR.add(box(0.14, 0.12, 0.14, L.skin, 0, -0.47, 0));
  body.add(armL, armR);

  const head = new THREE.Group(); head.position.set(0, 1.38, 0);
  head.add(sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), mat(L.skin))));
  // gözler
  for (const x of [-0.09, 0.09]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.02), mat(0x1a1a1a));
    e.position.set(x, 0.03, 0.255); head.add(e);
  }
  if (L.hair) head.add(box(0.5, 0.14, 0.5, L.hair, 0, 0.2, -0.03));
  if (L.beard) {
    const b = sh(new THREE.Mesh(new THREE.ConeGeometry(0.24, dwarf ? 0.5 : 0.32, 6), mat(L.beard)));
    b.rotation.x = Math.PI; b.position.set(0, dwarf ? -0.28 : -0.2, 0.12); head.add(b);
  }
  addHat(head, L);
  body.add(head);

  // sırt çantası çapası: eşyalar buraya dizilir
  const back = new THREE.Group();
  back.position.set(0, 0.95, -0.42);
  body.add(back);
  const hand = new THREE.Group();
  hand.position.set(0, 0.85, 0.42);
  body.add(hand);

  root.scale.setScalar(L.scale);
  root.userData = { body, legL, legR, armL, armR, head, back, hand, phase: Math.random() * 6 };
  return root;
}

function addHat(head, L) {
  const c = L.hatColor;
  switch (L.hat) {
    case 'cap': {
      const h = sh(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.55, 6), mat(c)));
      h.position.y = 0.38; h.rotation.z = 0.25; head.add(h);
      break;
    }
    case 'mining':
      head.add(cyl(0.3, 0.32, 0.18, 8, c, 0, 0.2, 0, { metalness: 0.4 }));
      head.add(cyl(0.34, 0.34, 0.03, 8, c, 0, 0.12, 0, { metalness: 0.4 }));
      head.add(cyl(0.06, 0.06, 0.06, 6, 0xfff2a0, 0, 0.22, 0.3, { emissive: 0xffe066, emissiveIntensity: 0.9 }).rotateX(Math.PI / 2));
      break;
    case 'hat':
      head.add(cyl(0.42, 0.42, 0.04, 10, c, 0, 0.18, 0));
      head.add(cyl(0.22, 0.26, 0.26, 8, c, 0, 0.32, 0));
      break;
    case 'helmet':
      head.add(cyl(0.29, 0.3, 0.42, 8, c, 0, 0.08, 0, { metalness: 0.6, roughness: 0.35 }));
      head.add(box(0.36, 0.05, 0.05, 0x1a1a1a, 0, 0.06, 0.3));
      head.add(box(0.06, 0.2, 0.32, L.tabard || C.red, 0, 0.36, 0));
      break;
    case 'kettle':
      head.add(cyl(0.2, 0.3, 0.16, 8, c, 0, 0.22, 0, { metalness: 0.5 }));
      head.add(cyl(0.42, 0.42, 0.03, 10, c, 0, 0.14, 0, { metalness: 0.5 }));
      break;
    case 'crown':
      head.add(cyl(0.24, 0.24, 0.12, 8, c, 0, 0.26, 0, { metalness: 0.7, roughness: 0.3 }));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const p = sh(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), mat(c, { metalness: 0.7 })));
        p.position.set(Math.cos(a) * 0.22, 0.37, Math.sin(a) * 0.22); head.add(p);
      }
      break;
    case 'wizard': {
      const h = sh(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 7), mat(c)));
      h.position.y = 0.45; h.rotation.z = -0.18; head.add(h);
      head.add(cyl(0.4, 0.4, 0.04, 10, c, 0, 0.14, 0));
      break;
    }
    case 'crest':
      head.add(cyl(0.29, 0.3, 0.4, 8, c, 0, 0.1, 0, { metalness: 0.7, roughness: 0.3 }));
      head.add(box(0.36, 0.05, 0.05, 0x1a1a1a, 0, 0.06, 0.3));
      head.add(box(0.07, 0.24, 0.42, C.red, 0, 0.4, -0.02));
      break;
  }
}

// Yürüme/çalışma animasyonu
export function animateCharacter(ch, dt, moving, speed = 1, working = false) {
  const u = ch.userData;
  u.phase += dt * (moving ? 10 * speed : working ? 9 : 2);
  const s = moving ? Math.sin(u.phase) : 0;
  u.legL.rotation.x = s * 0.7;
  u.legR.rotation.x = -s * 0.7;
  if (working) {
    u.armR.rotation.x = -1.6 + Math.sin(u.phase) * 0.9;
    u.armL.rotation.x = -0.4;
  } else if (u.carrying) {
    u.armL.rotation.x = u.armR.rotation.x = -0.25;
  } else {
    u.armL.rotation.x = -s * 0.6;
    u.armR.rotation.x = s * 0.6;
  }
  u.body.position.y = moving ? Math.abs(Math.sin(u.phase)) * 0.07 : Math.sin(u.phase) * 0.012;
}

// ---------- Doğa ----------
export function makeTree(rng = Math.random, variant = 0) {
  const g = new THREE.Group();
  const h = 0.9 + rng() * 0.5;
  g.add(cyl(0.14, 0.2, h, 6, C.woodDark, 0, h / 2, 0));
  const cols = [C.leaf, C.leaf2, C.leaf3];
  if (variant % 2 === 0) {
    for (let i = 0; i < 3; i++) {
      const r = 0.95 - i * 0.24;
      const c = sh(new THREE.Mesh(new THREE.ConeGeometry(r, 0.95, 7), mat(cols[(i + variant) % 3])));
      c.position.y = h + 0.3 + i * 0.5; g.add(c);
    }
  } else {
    const c = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), mat(cols[variant % 3])));
    c.position.y = h + 0.6; g.add(c);
    const c2 = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), mat(cols[(variant + 1) % 3])));
    c2.position.set(0.4, h + 0.4, 0.25); g.add(c2);
  }
  g.rotation.y = rng() * 6;
  g.scale.setScalar(0.9 + rng() * 0.35);
  return g;
}

export function makeRock(color = C.rock, s = 1, speck = null) {
  const g = new THREE.Group();
  const m = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 * s, 0), mat(color)), true);
  m.position.y = 0.35 * s; m.scale.y = 0.75; g.add(m);
  if (speck) {
    for (let i = 0; i < 4; i++) {
      const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 * s, 0), mat(speck, { emissive: speck, emissiveIntensity: 0.25, metalness: 0.3 }));
      const a = i * 1.7;
      o.position.set(Math.cos(a) * 0.45 * s, 0.35 * s + Math.sin(i) * 0.15, Math.sin(a) * 0.45 * s);
      g.add(o);
    }
  }
  g.rotation.y = Math.random() * 6;
  return g;
}

export function makeStump() {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.36, 0.4, 8, C.wood, 0, 0.2, 0));
  g.add(cyl(0.29, 0.29, 0.02, 8, C.woodLight, 0, 0.41, 0));
  return g;
}

export function makeFence(len) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / 1.2) + 1);
  for (let i = 0; i < n; i++) g.add(box(0.12, 0.7, 0.12, C.woodDark, -len / 2 + (len * i) / (n - 1), 0.35, 0));
  g.add(box(len, 0.08, 0.06, C.wood, 0, 0.5, 0));
  g.add(box(len, 0.08, 0.06, C.wood, 0, 0.25, 0));
  return g;
}

// ---------- Yapılar ----------
// Her yapı, eşyaların dizileceği "slot" çapalarını userData.slots içinde döndürür.

export function makeSmelter(tint) {
  const g = new THREE.Group();
  g.add(box(3.2, 0.2, 2.2, C.stoneDark, 0, 0.1, 0));
  g.add(box(1.8, 1.6, 1.6, C.stone, 0, 0.9, -0.2));
  g.add(cyl(0.45, 0.65, 1.6, 8, tint || C.stoneDark, 0, 2.4, -0.4));
  g.add(cyl(0.5, 0.5, 0.15, 8, C.stone, 0, 3.25, -0.4));
  const mouth = box(0.8, 0.6, 0.1, C.fire, 0, 0.8, 0.62, { emissive: 0xff6a00, emissiveIntensity: 1.4 });
  mouth.castShadow = false;
  g.add(mouth);
  g.add(box(1.0, 0.12, 0.2, C.stoneDark, 0, 1.16, 0.62));
  // kaynak tepsileri
  g.add(box(0.9, 0.5, 0.9, C.plank, -1.35, 0.35, 0.6));
  g.add(box(0.9, 0.5, 0.9, C.plank, 1.35, 0.35, 0.6));
  const light = new THREE.PointLight(0xff8a2a, 0, 6, 1.6);
  light.position.set(0, 1, 1.2);
  g.add(light);
  g.userData = {
    glow: mouth, light,
    slots: { in0: v(-1.35, 0.6, 0.6), in1: v(1.35, 0.6, 0.6), out: v(0, 0.2, 1.55) },
    smoke: v(0, 3.4, -0.4),
  };
  return g;
}

export function makeAnvil() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, C.stoneDark, 0, 0.075, 0));
  g.add(cyl(0.38, 0.45, 0.6, 8, C.wood, 0, 0.45, -0.1));
  const a = new THREE.Group(); a.position.set(0, 0.75, -0.1);
  a.add(box(0.3, 0.2, 0.3, C.ironDark, 0, 0.1, 0, { metalness: 0.6 }));
  a.add(box(0.9, 0.22, 0.38, C.ironDark, 0, 0.3, 0, { metalness: 0.6, roughness: 0.4 }));
  const horn = sh(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), mat(C.ironDark, { metalness: 0.6 })));
  horn.rotation.z = Math.PI / 2; horn.position.set(0.65, 0.32, 0); a.add(horn);
  g.add(a);
  // su teknesi ve masalar
  g.add(box(0.6, 0.4, 0.4, C.woodDark, 0, 0.3, -0.85));
  g.add(box(0.5, 0.05, 0.3, 0x3d7ab8, 0, 0.51, -0.85, { emissive: 0x0a2a4a }));
  g.add(box(0.9, 0.5, 0.9, C.plank, -1.15, 0.4, 0.45));
  g.add(box(0.9, 0.5, 0.9, C.plank, 1.15, 0.4, 0.45));
  g.add(box(0.12, 1.4, 0.12, C.woodDark, -1.4, 0.7, -0.8));
  g.add(box(0.12, 1.4, 0.12, C.woodDark, 1.4, 0.7, -0.8));
  g.add(box(3.0, 0.1, 0.12, C.woodDark, 0, 1.4, -0.8));
  g.userData = {
    hit: a,
    slots: { in0: v(-1.15, 0.65, 0.45), in1: v(1.15, 0.65, 0.45), out: v(0, 0.2, 1.3) },
    spark: v(0, 1.2, -0.1),
  };
  return g;
}

export function makeBench() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0x8a7a64, 0, 0.075, 0));
  g.add(box(1.6, 0.12, 0.8, C.plank, 0, 0.85, -0.2));
  for (const [x, z] of [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.1], [0.7, 0.1]]) g.add(box(0.1, 0.8, 0.1, C.woodDark, x, 0.45, z));
  const sh1 = makeItem('shield'); sh1.rotation.x = -1.2; sh1.position.set(-0.35, 1.0, -0.5); g.add(sh1);
  const sh2 = makeItem('shield'); sh2.rotation.x = -1.2; sh2.position.set(0.35, 1.0, -0.5); g.add(sh2);
  g.add(box(0.9, 0.5, 0.9, C.plank, -1.15, 0.4, 0.55));
  g.add(box(0.9, 0.5, 0.9, C.plank, 1.15, 0.4, 0.55));
  const hammer = new THREE.Group(); hammer.position.set(0, 0.95, -0.15);
  hammer.add(box(0.06, 0.06, 0.4, C.woodDark, 0, 0, 0));
  hammer.add(box(0.12, 0.12, 0.2, C.ironDark, 0, 0, 0.2));
  g.add(hammer);
  g.userData = { hit: hammer, slots: { in0: v(-1.15, 0.65, 0.55), in1: v(1.15, 0.65, 0.55), out: v(0, 0.2, 1.3) }, spark: v(0, 1.1, -0.1) };
  return g;
}

export function makeArmory() {
  const g = new THREE.Group();
  g.add(box(3.6, 0.2, 2.4, C.stoneDark, 0, 0.1, 0));
  g.add(box(2.0, 2.0, 1.6, 0x7a6f68, 0, 1.1, -0.3));
  g.add(box(2.3, 0.3, 1.9, C.red, 0, 2.2, -0.3));
  g.add(cyl(0.35, 0.5, 1.2, 8, C.stoneDark, 0.6, 2.9, -0.5));
  const mouth = box(1.0, 0.7, 0.1, C.fire, 0, 0.9, 0.52, { emissive: 0xff5a00, emissiveIntensity: 1.5 });
  mouth.castShadow = false; g.add(mouth);
  // manken
  const man = new THREE.Group(); man.position.set(-1.5, 0, -0.6);
  man.add(cyl(0.05, 0.05, 1.1, 6, C.woodDark, 0, 0.55, 0));
  const ar = makeItem('armor'); ar.position.y = 0.95; ar.scale.setScalar(1.6); man.add(ar);
  g.add(man);
  g.add(box(0.9, 0.5, 0.9, C.plank, -1.35, 0.4, 0.75));
  g.add(box(0.9, 0.5, 0.9, C.plank, 1.35, 0.4, 0.75));
  const light = new THREE.PointLight(0xff7a1a, 0, 6, 1.6);
  light.position.set(0, 1, 1.3);
  g.add(light);
  g.userData = { glow: mouth, light, slots: { in0: v(-1.35, 0.65, 0.75), in1: v(1.35, 0.65, 0.75), out: v(0, 0.2, 1.65) }, smoke: v(0.6, 3.5, -0.5) };
  return g;
}

export function makeStall(canopy = C.green, stripe = C.cream) {
  const g = new THREE.Group();
  g.add(box(3.4, 0.9, 1.0, C.plank, 0, 0.45, 0));
  g.add(box(3.6, 0.1, 1.2, C.woodDark, 0, 0.95, 0));
  for (const x of [-1.65, 1.65]) for (const z of [-0.5, 0.5]) g.add(box(0.12, 2.3, 0.12, C.woodDark, x, 1.15, z));
  for (let i = 0; i < 6; i++) {
    const s = box(0.62, 0.08, 1.7, i % 2 ? stripe : canopy, -1.55 + i * 0.62, 2.35, 0.1);
    s.rotation.x = 0.18; g.add(s);
  }
  g.userData = { slots: { shelf: v(0, 1.0, 0) } };
  return g;
}

export function makeMineEntrance() {
  const g = new THREE.Group();
  const rockMat = mat(C.stoneDark);
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI;
    const r = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + (i % 2) * 0.3, 0), rockMat), true);
    r.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5 + 0.3, 0);
    g.add(r);
  }
  g.add(box(2.0, 1.6, 0.2, 0x151210, 0, 0.8, -0.2));
  g.add(box(0.18, 1.8, 0.18, C.wood, -0.9, 0.9, 0.2));
  g.add(box(0.18, 1.8, 0.18, C.wood, 0.9, 0.9, 0.2));
  g.add(box(2.1, 0.2, 0.22, C.wood, 0, 1.8, 0.2));
  // ray ve vagon
  g.add(box(0.06, 0.04, 2.4, C.ironDark, -0.35, 0.03, 1.2));
  g.add(box(0.06, 0.04, 2.4, C.ironDark, 0.35, 0.03, 1.2));
  const cart = new THREE.Group(); cart.position.set(0, 0, 1.6);
  cart.add(box(0.9, 0.45, 0.7, C.wood, 0, 0.42, 0));
  for (const x of [-0.35, 0.35]) for (const z of [-0.25, 0.25]) cart.add(cyl(0.12, 0.12, 0.08, 8, C.ironDark, x + Math.sign(x) * 0.05, 0.14, z).rotateZ(Math.PI / 2));
  const o = makeItem('ore'); o.position.set(0, 0.55, 0); cart.add(o);
  const o2 = makeItem('ore'); o2.position.set(0.2, 0.6, 0.1); cart.add(o2);
  g.add(cart);
  return g;
}

export function makeTavern() {
  const g = new THREE.Group();
  g.add(box(4.2, 2.2, 3, 0xd9c6a5, 0, 1.1, 0));
  for (const x of [-2.05, 2.05]) g.add(box(0.15, 2.2, 3.05, C.woodDark, x, 1.1, 0));
  g.add(box(4.3, 0.15, 3.05, C.woodDark, 0, 1.2, 0));
  const roof = sh(new THREE.Mesh(new THREE.CylinderGeometry(0, 2.6, 1.6, 4, 1), mat(0x9c4a2e)));
  roof.rotation.y = Math.PI / 4; roof.position.y = 3.0; roof.scale.set(1.15, 1, 0.85);
  g.add(roof);
  g.add(box(0.8, 1.3, 0.1, C.woodDark, 0, 0.65, 1.52));
  g.add(box(0.6, 0.5, 0.08, 0xffd27a, -1.2, 1.5, 1.52, { emissive: 0xffa040, emissiveIntensity: 0.6 }));
  g.add(box(0.6, 0.5, 0.08, 0xffd27a, 1.2, 1.5, 1.52, { emissive: 0xffa040, emissiveIntensity: 0.6 }));
  g.add(box(0.14, 1.6, 0.14, C.stoneDark, 1.2, 3.6, -0.4));
  return g;
}

// ---------- Bölgelere özel dekor ----------
export function makeWall(len) {
  const g = new THREE.Group();
  g.add(box(len, 2.2, 0.9, 0x8d877e, 0, 1.1, 0));
  const n = Math.floor(len / 0.9);
  for (let i = 0; i < n; i += 2) g.add(box(0.6, 0.5, 0.95, 0x8d877e, -len / 2 + 0.45 + i * 0.9, 2.45, 0));
  for (const x of [-len / 2, len / 2]) g.add(cyl(0.9, 1.0, 3.4, 8, 0x7c766e, x, 1.7, 0));
  for (const x of [-len / 2, len / 2]) {
    const r = sh(new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.2, 8), mat(0x6a3a5a)));
    r.position.set(x, 4.0, 0); g.add(r);
  }
  return g;
}

export function makeTorch(light = true) {
  const g = new THREE.Group();
  g.add(box(0.12, 1.6, 0.12, C.woodDark, 0, 0.8, 0));
  g.add(cyl(0.14, 0.09, 0.18, 6, C.ironDark, 0, 1.65, 0));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 6), mat(0xffb347, { emissive: 0xff7a1a, emissiveIntensity: 2 }));
  flame.position.y = 1.9;
  g.add(flame);
  if (light) {
    const l = new THREE.PointLight(0xff9a4a, 9, 7, 1.6);
    l.position.y = 2.1;
    g.add(l);
  }
  g.userData = { flame };
  return g;
}

export function makeCrystalCluster(color = 0x9a7aff, s = 1) {
  const g = new THREE.Group();
  g.add(sh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 * s, 0), mat(0x3a3646)), true));
  g.children[0].position.y = 0.25 * s; g.children[0].scale.y = 0.6;
  for (let i = 0; i < 5; i++) {
    const h = (0.7 + (i % 3) * 0.3) * s;
    const c = sh(new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, h, 5), mat(color, { emissive: color, emissiveIntensity: 0.55, roughness: 0.2 })));
    const a = i * 1.3;
    c.position.set(Math.cos(a) * 0.25 * s, 0.35 * s + h / 2, Math.sin(a) * 0.25 * s);
    c.rotation.set(Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4);
    g.add(c);
  }
  g.rotation.y = Math.random() * 6;
  return g;
}

export function makeSpring() {
  const g = new THREE.Group();
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.08, 12), mat(0x4fc3ff, { emissive: 0x1a6aa0, emissiveIntensity: 0.9, roughness: 0.1 }));
  pool.position.y = 0.05;
  g.add(pool);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mat(0x4a4458)), true);
    r.position.set(Math.cos(a) * 1.25, 0.15, Math.sin(a) * 1.25);
    g.add(r);
  }
  return g;
}

export function makeLavaPool(r = 1.4) {
  const g = new THREE.Group();
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, 0.08, 12), mat(0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 1.3, roughness: 0.6 }));
  pool.position.y = 0.04;
  g.add(pool);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rk = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), mat(0x2a2220)), true);
    rk.position.set(Math.cos(a) * (r + 0.2), 0.18, Math.sin(a) * (r + 0.2));
    g.add(rk);
  }
  g.userData = { pool };
  return g;
}

export function makeSandMound() {
  const g = new THREE.Group();
  const m = sh(new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe2c27a)), true);
  m.scale.y = 0.55;
  g.add(m);
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), mat(C.gold, { metalness: 0.7, emissive: 0x4a3200 }));
    s.position.set(Math.cos(i * 2) * 0.3, 0.25, Math.sin(i * 2) * 0.3);
    g.add(s);
  }
  return g;
}

export function makeScalePile() {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const s = makeItem('scale');
    s.position.set((Math.random() - 0.5) * 0.9, i * 0.04, (Math.random() - 0.5) * 0.7);
    s.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * 6, (Math.random() - 0.5) * 0.6);
    g.add(s);
  }
  return g;
}

// Uyuyan ejderha: userData.head, eyes ve mouth animasyon için
export function makeDragon() {
  const g = new THREE.Group();
  const scale = 0x2f7a5a, belly = 0xd9a25a, dark = 0x1f4f3a;
  const body = sh(new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), mat(scale)));
  body.scale.set(1.3, 0.8, 1.7); body.position.y = 1.2; g.add(body);
  const bellyM = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), mat(belly));
  bellyM.scale.set(1.2, 0.6, 1.5); bellyM.position.set(0, 0.8, 0.3); g.add(bellyM);
  // sırt dikenleri
  for (let i = 0; i < 6; i++) {
    const sp = sh(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 4), mat(dark)));
    sp.position.set(0, 2.3 - Math.abs(i - 2.5) * 0.12, -1.8 + i * 0.6); g.add(sp);
  }
  // kanatlar (katlı)
  for (const sx of [-1, 1]) {
    const w = sh(new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 2.6), mat(dark)));
    w.position.set(sx * 1.8, 1.9, -0.4); w.rotation.z = sx * -0.6; g.add(w);
  }
  // kuyruk
  const tail = new THREE.Group(); tail.position.set(0, 0.8, -2.4);
  for (let i = 0; i < 5; i++) {
    const t = sh(new THREE.Mesh(new THREE.SphereGeometry(0.55 - i * 0.09, 8, 6), mat(scale)));
    t.position.set(Math.sin(i * 0.7) * 0.6, -i * 0.12, -i * 0.65); tail.add(t);
  }
  g.add(tail);
  // bacaklar
  for (const [x, z] of [[-1.3, 1.2], [1.3, 1.2], [-1.3, -1.2], [1.3, -1.2]]) g.add(cyl(0.38, 0.45, 0.9, 7, scale, x, 0.45, z));
  // boyun ve kafa
  const neck = new THREE.Group(); neck.position.set(0, 1.6, 2.2);
  const nm = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.6, 8), mat(scale)));
  nm.rotation.x = 1.1; nm.position.set(0, 0, 0.6); neck.add(nm);
  const head = new THREE.Group(); head.position.set(0, -0.2, 1.4);
  const skull = sh(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.3), mat(scale)));
  head.add(skull);
  const snout = sh(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.8), mat(scale)));
  snout.position.set(0, -0.12, 0.95); head.add(snout);
  for (const sx of [-1, 1]) {
    const horn = sh(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 5), mat(0xe9e2d0)));
    horn.position.set(sx * 0.35, 0.45, -0.45); horn.rotation.x = -0.8; head.add(horn);
  }
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.06), mat(0xffd84a, { emissive: 0xffaa00, emissiveIntensity: 0 }));
    e.position.set(sx * 0.4, 0.12, 0.6); head.add(e); eyes.push(e);
  }
  const mouth = new THREE.Object3D(); mouth.position.set(0, -0.15, 1.45); head.add(mouth);
  neck.add(head);
  g.add(neck);
  g.userData = { body, neck, head, eyes, mouth, tail };
  return g;
}

// Kraliyet Sandığı: sipariş teslim yeri
export function makeChest() {
  const g = new THREE.Group();
  g.add(box(1.5, 0.7, 0.9, 0x7a3b1f, 0, 0.35, 0));
  const lid = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.5, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mat(0x8a4626)));
  lid.position.y = 0.7; lid.rotation.x = -Math.PI / 2; g.add(lid);
  for (const x of [-0.5, 0.5]) {
    g.add(box(0.1, 0.72, 0.94, C.gold, x, 0.36, 0, { metalness: 0.6, roughness: 0.4 }));
  }
  g.add(box(0.26, 0.26, 0.06, C.gold, 0, 0.62, 0.47, { metalness: 0.6, roughness: 0.4 }));
  // sancak
  g.add(box(0.08, 2.2, 0.08, C.woodDark, 0.95, 1.1, -0.2));
  const flag = box(0.7, 0.9, 0.04, 0x2f4f9a, 1.33, 1.75, -0.2);
  g.add(flag);
  g.add(box(0.26, 0.26, 0.05, C.gold, 1.33, 1.8, -0.17));
  g.userData = { flag };
  return g;
}

export function makeBridge(w) {
  const g = new THREE.Group();
  const len = w + 1.6;
  for (let i = 0; i < 7; i++) g.add(box(len, 0.1, 0.32, C.plank, 0, 0.32 + Math.sin((i / 6) * Math.PI) * 0.05, -0.99 + i * 0.33));
  for (const z of [-1.15, 1.15]) {
    g.add(box(len, 0.08, 0.08, C.woodDark, 0, 0.85, z));
    for (const x of [-len / 2 + 0.1, 0, len / 2 - 0.1]) g.add(box(0.1, 0.6, 0.1, C.woodDark, x, 0.55, z));
  }
  return g;
}

export function makeCrateStack() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.7, 0.7, C.plank, 0, 0.35, 0));
  g.add(box(0.6, 0.6, 0.6, C.wood, 0.75, 0.3, 0.1));
  g.add(box(0.55, 0.55, 0.55, C.plank, 0.3, 0.98, 0));
  return g;
}

export function makeBarrel() {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.3, 0.75, 9, C.wood, 0, 0.38, 0));
  g.add(cyl(0.32, 0.32, 0.06, 9, C.ironDark, 0, 0.18, 0));
  g.add(cyl(0.32, 0.32, 0.06, 9, C.ironDark, 0, 0.58, 0));
  return g;
}

export function v(x, y, z) { return new THREE.Vector3(x, y, z); }
