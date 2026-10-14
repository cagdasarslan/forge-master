// Bölgelere özgü atölye makineleri. Her model userData içinde şunları döndürür:
//   slots: { in0, in1, out } eşya tepsileri (yerel konum)
//   glow/light: çalışırken parlayan ağız ve ışık, smoke: duman çıkış noktası
//   hit/spark: vuruş animasyonu yapan parça ve kıvılcım noktası
//   spin: çalışırken dönen parçalar [{ obj, axis, speed }], bob: süzülen parça
import * as THREE from 'three';
import { C, mat, sh, box, cyl, v, makeItem, makeSmelter, makeAnvil, makeBench, makeArmory } from './models.js';

function glowMouth(w, h, color = C.fire, emissive = 0xff6a00) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), mat(color, { emissive, emissiveIntensity: 1.4 }));
  return m;
}
function addLight(g, color, x, y, z) {
  const l = new THREE.PointLight(color, 0, 6, 1.6);
  l.position.set(x, y, z);
  g.add(l);
  return l;
}
function trays(g, color = C.plank, y = 0.35, z = 0.6, x = 1.35) {
  g.add(box(0.9, y * 2 - 0.2, 0.9, color, -x, y, z));
  g.add(box(0.9, y * 2 - 0.2, 0.9, color, x, y, z));
}

// ---------- Bakır Vadisi ----------
// Kubbeli tuğla bronz ocağı
function makeKiln() {
  const g = new THREE.Group();
  g.add(box(3.2, 0.2, 2.2, 0x8a5a3a, 0, 0.1, 0));
  const dome = sh(new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xb5603a)));
  dome.position.set(0, 0.2, -0.2); dome.scale.y = 1.25; g.add(dome);
  for (let i = 0; i < 3; i++) {
    const band = cyl(1.17 - i * 0.28, 1.17 - i * 0.28, 0.07, 12, 0x8a3e22, 0, 0.45 + i * 0.42, -0.2);
    band.scale.y = 1; g.add(band);
  }
  g.add(cyl(0.22, 0.3, 1.0, 7, 0x6f8a5a, 0.55, 1.75, -0.5));
  const mouth = glowMouth(0.7, 0.5); mouth.position.set(0, 0.55, 0.92); g.add(mouth);
  g.add(box(0.95, 0.12, 0.25, 0x8a3e22, 0, 0.86, 0.9));
  trays(g, 0xa0683c);
  const light = addLight(g, 0xff8a2a, 0, 0.9, 1.4);
  g.userData = { glow: mouth, light, slots: { in0: v(-1.35, 0.6, 0.6), in1: v(1.35, 0.6, 0.6), out: v(0, 0.2, 1.55) }, smoke: v(0.55, 2.4, -0.5) };
  return g;
}

// Mızrak tornası: dönen kütük ve mızrak rafı
function makeSpearShop() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0x9a7a54, 0, 0.075, 0));
  // tezgah ayakları ve torna
  for (const x of [-0.8, 0.8]) g.add(box(0.15, 0.9, 0.15, C.woodDark, x, 0.45, -0.2));
  g.add(box(1.9, 0.12, 0.5, C.plank, 0, 0.92, -0.2));
  const log = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8).rotateZ(Math.PI / 2), mat(C.woodLight)));
  log.position.set(0, 1.12, -0.2); g.add(log);
  const wheel = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 10).rotateZ(Math.PI / 2), mat(C.wood)));
  wheel.position.set(-1.05, 1.12, -0.2); g.add(wheel);
  // mızrak rafı
  g.add(box(0.1, 1.8, 0.1, C.woodDark, -1.3, 0.9, -0.85));
  g.add(box(0.1, 1.8, 0.1, C.woodDark, 1.3, 0.9, -0.85));
  g.add(box(2.7, 0.08, 0.1, C.woodDark, 0, 1.6, -0.85));
  for (let i = 0; i < 6; i++) {
    const s = makeItem('spear');
    s.rotation.z = Math.PI / 2 - 0.12; s.position.set(-1.0 + i * 0.4, 0.9, -0.95);
    g.add(s);
  }
  trays(g, C.plank, 0.4, 0.55, 1.2);
  g.userData = { spin: [{ obj: log, axis: 'x', speed: 14 }, { obj: wheel, axis: 'x', speed: 6 }], slots: { in0: v(-1.2, 0.65, 0.55), in1: v(1.2, 0.65, 0.55), out: v(0, 0.2, 1.3) } };
  return g;
}

// Miğfer döküm tezgahı: pota, kalıplar ve stantlarda miğferler
function makeMould() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0x8a6a4a, 0, 0.075, 0));
  g.add(box(1.6, 0.7, 0.9, C.stoneDark, 0, 0.45, -0.3));
  const pot = cyl(0.3, 0.22, 0.35, 8, 0x3a2a24, 0, 0.98, -0.3);
  g.add(pot);
  const melt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 8), mat(0xffb347, { emissive: 0xff7a1a, emissiveIntensity: 1.2 }));
  melt.position.set(0, 1.16, -0.3); g.add(melt);
  for (const x of [-1.05, 1.05]) {
    g.add(cyl(0.05, 0.05, 1.0, 6, C.woodDark, x, 0.5, -0.75));
    const h = makeItem('helmet'); h.position.set(x, 1.0, -0.75); g.add(h);
  }
  trays(g, C.plank, 0.4, 0.55, 1.15);
  const light = addLight(g, 0xffa040, 0, 1.4, 0.4);
  g.userData = { glow: melt, light, slots: { in0: v(-1.15, 0.65, 0.55), in1: v(1.15, 0.65, 0.55), out: v(0, 0.2, 1.3) }, smoke: v(0, 1.4, -0.3) };
  return g;
}

// ---------- Kömür Kalesi ----------
// Yüksek fırın kulesi, körük çarkı ve merdiven
function makeBlastFurnace() {
  const g = new THREE.Group();
  g.add(box(3.4, 0.25, 2.4, 0x5d5a58, 0, 0.12, 0));
  g.add(cyl(1.0, 1.2, 3.4, 10, 0x7a6f68, 0, 1.9, -0.3));
  for (let i = 0; i < 4; i++) g.add(cyl(1.03 - i * 0.05, 1.03 - i * 0.05, 0.1, 10, C.ironDark, 0, 0.7 + i * 0.8, -0.3, { metalness: 0.5 }));
  g.add(cyl(0.7, 0.9, 0.6, 10, 0x5d5a58, 0, 3.9, -0.3));
  const mouth = glowMouth(0.75, 0.6, C.fire, 0xff4a00); mouth.position.set(0, 0.75, 0.86); g.add(mouth);
  // körük kutusu ve çark
  g.add(box(0.6, 0.8, 0.9, C.wood, 1.3, 0.65, -0.3));
  const wheel = sh(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.07, 6, 12), mat(C.woodDark)));
  wheel.position.set(1.65, 0.95, -0.3); wheel.rotation.y = Math.PI / 2; g.add(wheel);
  for (let i = 0; i < 4; i++) {
    const sp = box(0.05, 0.95, 0.05, C.woodDark, 0, 0, 0); sp.rotation.x = (i / 4) * Math.PI; wheel.add(sp);
  }
  // merdiven
  for (const z of [-0.95, -0.65]) g.add(box(0.06, 3.4, 0.06, C.woodDark, -1.15, 1.8, z));
  for (let i = 0; i < 8; i++) g.add(box(0.06, 0.05, 0.36, C.woodDark, -1.15, 0.4 + i * 0.42, -0.8));
  trays(g, 0x6a5a4a, 0.35, 0.75, 1.35);
  const light = addLight(g, 0xff7a1a, 0, 1.0, 1.5);
  g.userData = { glow: mouth, light, spin: [{ obj: wheel, axis: 'x', speed: 3 }], slots: { in0: v(-1.35, 0.6, 0.75), in1: v(1.35, 0.6, 0.75), out: v(0, 0.2, 1.65) }, smoke: v(0, 4.3, -0.3) };
  return g;
}

// Su çarkıyla çalışan çekiç (çelik kılıç dövülür)
function makeTripHammer() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0x6a6460, 0, 0.075, 0));
  // su oluğu ve çark
  g.add(box(0.5, 0.3, 2.0, C.woodDark, -1.25, 0.3, -0.2));
  g.add(box(0.4, 0.05, 1.9, 0x3d7ab8, -1.25, 0.46, -0.2, { emissive: 0x0a2a4a }));
  const wheel = new THREE.Group(); wheel.position.set(-1.25, 1.1, -0.2);
  wheel.add(sh(new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 6, 14).rotateY(Math.PI / 2), mat(C.wood))));
  for (let i = 0; i < 8; i++) {
    const p = box(0.08, 1.5, 0.2, C.plank, 0, 0, 0); p.rotation.x = (i / 8) * Math.PI; wheel.add(p);
  }
  g.add(wheel);
  // çekiç kolu
  g.add(box(0.2, 1.3, 0.2, C.woodDark, 0.3, 0.65, -0.6));
  const arm = new THREE.Group(); arm.position.set(0.3, 1.25, -0.6);
  arm.add(box(1.6, 0.14, 0.14, C.woodDark, 0.6, 0, 0));
  arm.add(box(0.35, 0.35, 0.35, C.ironDark, 1.3, -0.15, 0, { metalness: 0.6 }));
  g.add(arm);
  g.add(box(0.5, 0.45, 0.5, C.ironDark, 1.6, 0.3, -0.6, { metalness: 0.6 }));
  trays(g, C.plank, 0.4, 0.5, 1.15);
  g.userData = { hitArm: arm, spin: [{ obj: wheel, axis: 'x', speed: 2.5 }], slots: { in0: v(-0.2, 0.65, 0.55), in1: v(1.15, 0.65, 0.55), out: v(0, 0.2, 1.3) }, spark: v(1.6, 0.6, -0.6) };
  return g;
}

// ---------- Altın Nehri ----------
// Eğimli eleme oluğu: akan su ve elek
function makeSluice() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.12, 2.0, 0xc4a874, 0, 0.06, 0));
  const trough = new THREE.Group(); trough.position.set(0, 0.8, -0.4); trough.rotation.x = 0; trough.rotation.z = -0.12;
  trough.add(box(2.6, 0.08, 0.6, C.plank, 0, 0, 0));
  trough.add(box(2.6, 0.25, 0.06, C.wood, 0, 0.12, 0.3));
  trough.add(box(2.6, 0.25, 0.06, C.wood, 0, 0.12, -0.3));
  for (let i = 0; i < 6; i++) trough.add(box(0.04, 0.06, 0.55, C.woodDark, -1.1 + i * 0.44, 0.06, 0));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.5).rotateX(-Math.PI / 2), mat(0x5ab4e0, { emissive: 0x1a4a6a, transparent: true, opacity: 0.8 }));
  water.position.y = 0.1; trough.add(water);
  g.add(trough);
  for (const x of [-1.1, 0, 1.1]) g.add(box(0.1, 0.8 + x * 0.1, 0.1, C.woodDark, x, 0.4, -0.4));
  // elek
  const sieve = new THREE.Group(); sieve.position.set(0.9, 1.25, -0.4);
  sieve.add(sh(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 5, 12).rotateX(Math.PI / 2), mat(C.wood))));
  sieve.add(new THREE.Mesh(new THREE.CircleGeometry(0.3, 12).rotateX(-Math.PI / 2), mat(0x8a7a5c)));
  g.add(sieve);
  trays(g, C.plank, 0.35, 0.6, 1.25);
  g.userData = { shake: sieve, slots: { in0: v(-1.25, 0.55, 0.6), in1: v(1.25, 0.55, 0.6), out: v(0, 0.2, 1.3) } };
  return g;
}

// Kil pota ocağı (varak eritilir)
function makeCrucible() {
  const g = new THREE.Group();
  g.add(box(3.2, 0.2, 2.2, 0xa98458, 0, 0.1, 0));
  g.add(cyl(0.8, 1.0, 1.2, 10, 0xb07a4a, 0, 0.8, -0.2));
  g.add(cyl(0.82, 0.82, 0.1, 10, 0x8a5a3a, 0, 1.42, -0.2));
  const melt = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 10), mat(C.gold, { emissive: 0xffaa00, emissiveIntensity: 1.3, metalness: 0.4 }));
  melt.position.set(0, 1.45, -0.2); g.add(melt);
  const mouth = glowMouth(0.5, 0.35); mouth.position.set(0, 0.5, 0.7); g.add(mouth);
  // körük
  const bellows = new THREE.Group(); bellows.position.set(-1.0, 0.55, -0.5);
  bellows.add(box(0.5, 0.2, 0.7, C.leather, 0, 0, 0));
  bellows.add(box(0.12, 0.12, 0.5, C.wood, 0, 0, 0.55));
  g.add(bellows);
  trays(g, C.plank, 0.35, 0.65, 1.35);
  const light = addLight(g, 0xffc040, 0, 1.6, 0.6);
  g.userData = { glow: mouth, light, pump: bellows, slots: { in0: v(-1.35, 0.6, 0.65), in1: v(1.35, 0.6, 0.65), out: v(0, 0.2, 1.5) }, smoke: v(0, 1.7, -0.2) };
  return g;
}

// Kuyumcu masası: tente, lamba, mücevher vitrinleri
function makeJeweler() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0xd9c08a, 0, 0.075, 0));
  g.add(box(1.9, 0.12, 0.9, 0x6b2a8a, 0, 0.9, -0.3));
  for (const x of [-0.85, 0.85]) for (const z of [-0.65, 0.05]) g.add(box(0.1, 0.85, 0.1, C.woodDark, x, 0.45, z));
  // tente
  for (const x of [-1.3, 1.3]) g.add(box(0.08, 2.0, 0.08, C.woodDark, x, 1.0, -0.9));
  for (let i = 0; i < 5; i++) {
    const s = box(0.56, 0.06, 1.0, i % 2 ? 0x6b2a8a : C.gold, -1.12 + i * 0.56, 2.05, -0.5); s.rotation.x = 0.25; g.add(s);
  }
  // mücevherler ve taç
  const crown = makeItem('crown'); crown.position.set(-0.4, 0.96, -0.35); g.add(crown);
  const gems = [];
  for (let i = 0; i < 4; i++) {
    const gm = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), mat([C.red, C.blue, 0x4fae8a, C.gold][i], { emissive: [0x6a1010, 0x10206a, 0x105a3a, 0x4a3200][i] }));
    gm.position.set(0.25 + i * 0.16, 1.02, -0.3); g.add(gm); gems.push(gm);
  }
  // lamba
  g.add(box(0.05, 0.5, 0.05, C.ironDark, 0.75, 1.2, -0.6));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(0xfff2a0, { emissive: 0xffd060, emissiveIntensity: 1.2 }));
  lamp.position.set(0.75, 1.48, -0.6); g.add(lamp);
  trays(g, C.plank, 0.4, 0.55, 1.15);
  g.userData = { glint: gems, slots: { in0: v(-1.15, 0.65, 0.55), in1: v(1.15, 0.65, 0.55), out: v(0, 0.2, 1.3) } };
  return g;
}

// ---------- Kristal Mağaraları ----------
// Su ile çalışan kristal öğütücü taş
function makeGrinder() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0x3a3646, 0, 0.075, 0));
  for (const x of [-0.6, 0.6]) g.add(box(0.15, 1.3, 0.15, C.woodDark, x, 0.65, -0.3));
  const stone = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.25, 14).rotateZ(Math.PI / 2), mat(0x8d8a96)));
  stone.position.set(0, 1.1, -0.3); g.add(stone);
  g.add(box(1.5, 0.08, 0.08, C.ironDark, 0, 1.1, -0.3));
  g.add(box(1.0, 0.3, 0.6, C.woodDark, 0, 0.3, -0.3));
  g.add(box(0.9, 0.04, 0.5, 0x4fc3ff, 0, 0.46, -0.3, { emissive: 0x1a6aa0, emissiveIntensity: 0.8 }));
  trays(g, 0x4a4458, 0.4, 0.55, 1.2);
  const light = addLight(g, 0x9a7aff, 0, 1.4, 0.4);
  g.userData = { light, spin: [{ obj: stone, axis: 'x', speed: 6 }], spark: v(0, 0.6, 0.05), sparkColor: 0xb59aff, slots: { in0: v(-1.2, 0.65, 0.55), in1: v(1.2, 0.65, 0.55), out: v(0, 0.2, 1.3) } };
  return g;
}

// Büyü sunağı: rünlü taş halka, dikili taşlar ve süzülen kristal
function makeAltar() {
  const g = new THREE.Group();
  g.add(cyl(1.4, 1.5, 0.2, 14, 0x34313f, 0, 0.1, -0.2));
  const rune = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 6, 28).rotateX(Math.PI / 2), mat(0x9a7aff, { emissive: 0x6a3ae0, emissiveIntensity: 0.6 }));
  rune.position.set(0, 0.22, -0.2); g.add(rune);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    if (Math.sin(a) > 0.6) continue;
    const st = box(0.3, 1.3 + (i % 2) * 0.3, 0.25, 0x4a4458, Math.cos(a) * 1.25, 0.7, -0.2 + Math.sin(a) * 1.0);
    st.rotation.y = -a; g.add(st);
  }
  g.add(cyl(0.35, 0.45, 0.7, 8, 0x4a4458, 0, 0.55, -0.2));
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat(0xb59aff, { emissive: 0x6a3ae0, emissiveIntensity: 1.2 }));
  orb.position.set(0, 1.5, -0.2); g.add(orb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 5, 20), mat(C.gold, { emissive: 0x4a3200 }));
  ring.position.copy(orb.position); g.add(ring);
  trays(g, 0x4a4458, 0.35, 0.75, 1.45);
  const light = addLight(g, 0xb59aff, 0, 1.6, 0);
  g.userData = { glow: rune, light, bob: orb, spin: [{ obj: ring, axis: 'y', speed: 2 }, { obj: orb, axis: 'y', speed: 1.5 }], slots: { in0: v(-1.45, 0.6, 0.75), in1: v(1.45, 0.6, 0.75), out: v(0, 0.2, 1.5) } };
  return g;
}

// ---------- Ejderha Dağı ----------
// Kayaya oyulmuş obsidyen ocak ve lav kanalı
function makeObsidianForge() {
  const g = new THREE.Group();
  g.add(box(3.4, 0.2, 2.3, 0x2a2220, 0, 0.1, 0));
  const rock = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 0), mat(0x1e1a1e, { roughness: 0.4 })));
  rock.position.set(0, 1.0, -0.4); rock.scale.set(1.1, 1.0, 0.8); g.add(rock);
  for (let i = 0; i < 4; i++) {
    const sp = sh(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 5), mat(0x2a2030, { roughness: 0.3 })));
    sp.position.set(-0.8 + i * 0.55, 2.1 + (i % 2) * 0.2, -0.6); sp.rotation.z = (i - 1.5) * 0.2; g.add(sp);
  }
  const mouth = glowMouth(0.8, 0.55, 0xff5a1a, 0xff3a00); mouth.position.set(0, 0.7, 0.62); g.add(mouth);
  const channel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1.2), mat(0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 1.3 }));
  channel.position.set(0, 0.22, 0.9); g.add(channel);
  trays(g, 0x3a302c, 0.35, 0.65, 1.4);
  const light = addLight(g, 0xff5a1a, 0, 1.0, 1.3);
  g.userData = { glow: mouth, light, slots: { in0: v(-1.4, 0.6, 0.65), in1: v(1.4, 0.6, 0.65), out: v(0.7, 0.2, 1.5) }, smoke: v(0, 2.4, -0.4) };
  return g;
}

// Pul presi: vidalı pres ve kalkan rafı
function makeScalePress() {
  const g = new THREE.Group();
  g.add(box(3.0, 0.15, 2.0, 0x4a3a32, 0, 0.075, 0));
  for (const x of [-0.6, 0.6]) g.add(box(0.18, 1.8, 0.18, C.woodDark, x, 0.9, -0.3));
  g.add(box(1.4, 0.2, 0.3, C.woodDark, 0, 1.8, -0.3));
  const screw = cyl(0.07, 0.07, 0.9, 6, C.ironDark, 0, 1.3, -0.3, { metalness: 0.6 });
  g.add(screw);
  const plate = box(0.9, 0.12, 0.6, C.ironDark, 0, 0.85, -0.3, { metalness: 0.6 });
  g.add(plate);
  g.add(box(1.0, 0.5, 0.7, 0x3a302c, 0, 0.3, -0.3));
  const handle = box(0.9, 0.05, 0.05, C.wood, 0, 1.6, -0.3);
  g.add(handle);
  for (const x of [-1.25, 1.25]) {
    const s = makeItem('dragonshield'); s.rotation.x = -1.3; s.position.set(x, 1.0, -0.85); g.add(s);
  }
  trays(g, 0x3a302c, 0.4, 0.55, 1.2);
  g.userData = { press: plate, spin: [{ obj: handle, axis: 'y', speed: 3 }], spark: v(0, 0.9, -0.1), sparkColor: 0x7fd0a8, slots: { in0: v(-1.2, 0.65, 0.55), in1: v(1.2, 0.65, 0.55), out: v(0, 0.2, 1.3) } };
  return g;
}

export const MACHINES = {
  smelter: makeSmelter,
  anvil: makeAnvil,
  bench: makeBench,
  armory: makeArmory,
  kiln: makeKiln,
  spearshop: makeSpearShop,
  mould: makeMould,
  blastfurnace: makeBlastFurnace,
  triphammer: makeTripHammer,
  sluice: makeSluice,
  crucible: makeCrucible,
  jeweler: makeJeweler,
  grinder: makeGrinder,
  altar: makeAltar,
  obsidian: makeObsidianForge,
  scalepress: makeScalePress,
};

// Çalışırken makineye özgü hareketler
export function animateMachine(ud, running, dt, t) {
  if (ud.spin) for (const s of ud.spin) if (running) s.obj.rotation[s.axis] += s.speed * dt;
  if (ud.bob) ud.bob.position.y = 1.5 + Math.sin(t * (running ? 4 : 1.5)) * (running ? 0.15 : 0.06);
  if (ud.hitArm) ud.hitArm.rotation.z = running ? Math.max(0, Math.sin(t * 6)) * 0.35 : 0;
  if (ud.shake) ud.shake.position.x = 0.9 + (running ? Math.sin(t * 30) * 0.05 : 0);
  if (ud.pump) ud.pump.scale.y = running ? 1 + Math.sin(t * 8) * 0.35 : 1;
  if (ud.press) ud.press.position.y = 0.85 + (running ? Math.sin(t * 4) * 0.12 : 0.12);
  if (ud.glint) for (let i = 0; i < ud.glint.length; i++) ud.glint[i].rotation.y += dt * (running ? 4 : 0.6) * (i % 2 ? 1 : -1);
}

// ---------- Krallık ortak öğeleri ----------
// Kraliyet sancağı (her bölgede aynı: mavi-altın)
export function makeBanner(h = 3.4) {
  const g = new THREE.Group();
  g.add(cyl(0.07, 0.09, h, 6, C.woodDark, 0, h / 2, 0));
  g.add(cyl(0.12, 0.12, 0.12, 6, C.gold, 0, h + 0.05, 0, { metalness: 0.6 }));
  const flag = new THREE.Group(); flag.position.set(0, h - 0.2, 0);
  flag.add(box(0.06, 1.5, 0.9, 0x2f4f9a, 0, -0.75, 0.48));
  flag.add(box(0.07, 0.4, 0.4, C.gold, 0, -0.6, 0.48));
  g.add(flag);
  g.userData = { flag };
  return g;
}

// Yol tabelası: başkente ve komşu bölgelere
export function makeSignpost() {
  const g = new THREE.Group();
  g.add(box(0.14, 2.0, 0.14, C.woodDark, 0, 1.0, 0));
  const a = box(1.3, 0.3, 0.06, C.plank, 0.55, 1.7, 0); g.add(a);
  const b = box(1.1, 0.28, 0.06, C.plank, -0.45, 1.3, 0.02); b.rotation.y = 0.2; g.add(b);
  g.add(box(0.3, 0.2, 0.07, 0x2f4f9a, 0.95, 1.7, 0.01));
  return g;
}

// Kervan arabası: atlı, üstünde bölgenin malı
export function makeWagon(cargo) {
  const g = new THREE.Group();
  const body = new THREE.Group(); body.position.x = -0.6;
  body.add(box(1.9, 0.35, 1.1, C.wood, 0, 0.75, 0));
  body.add(box(1.9, 0.3, 0.06, C.woodDark, 0, 1.05, 0.55));
  body.add(box(1.9, 0.3, 0.06, C.woodDark, 0, 1.05, -0.55));
  for (const x of [-0.6, 0.6]) for (const z of [-0.6, 0.6]) {
    const w = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 10).rotateX(Math.PI / 2), mat(C.woodDark)));
    w.position.set(x, 0.32, z); body.add(w);
  }
  // örtü kemeri (kraliyet mavisi)
  const cover = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2), mat(0x2f4f9a, { side: THREE.DoubleSide })));
  cover.rotation.y = Math.PI / 2; cover.position.set(-0.35, 0.95, 0); body.add(cover);
  if (cargo) for (let i = 0; i < 4; i++) {
    const it = makeItem(cargo); it.position.set(0.35 + (i % 2) * 0.35, 0.95 + Math.floor(i / 2) * 0.25, (i % 2 ? 0.2 : -0.2)); body.add(it);
  }
  g.add(body);
  // at
  const horse = new THREE.Group(); horse.position.x = 1.25;
  horse.add(box(1.0, 0.5, 0.42, 0x6b4226, 0, 0.95, 0));
  horse.add(box(0.3, 0.55, 0.28, 0x6b4226, 0.5, 1.3, 0));
  horse.add(box(0.45, 0.25, 0.25, 0x6b4226, 0.72, 1.5, 0));
  for (const x of [-0.35, 0.35]) for (const z of [-0.14, 0.14]) horse.add(box(0.12, 0.7, 0.12, 0x5a3519, x, 0.35, z));
  horse.add(box(0.1, 0.4, 0.06, 0x2a1a10, 0.42, 1.45, 0));
  g.add(horse);
  g.userData = { horse, body };
  return g;
}

// Kervan durağı: başka bölgelerden gelen malın indiği platform
export function makeDepot() {
  const g = new THREE.Group();
  g.add(box(2.6, 0.2, 1.8, C.plank, 0, 0.1, 0));
  for (const x of [-1.2, 1.2]) g.add(box(0.12, 2.2, 0.12, C.woodDark, x, 1.1, -0.8));
  g.add(box(2.6, 0.12, 0.12, C.woodDark, 0, 2.2, -0.8));
  const sign = box(1.6, 0.4, 0.06, 0x2f4f9a, 0, 1.9, -0.75);
  g.add(sign);
  g.add(box(0.5, 0.2, 0.07, C.gold, 0, 1.9, -0.71));
  g.add(box(0.6, 0.6, 0.6, C.wood, -0.85, 0.5, -0.4));
  g.userData = { slots: { out: v(0.2, 0.25, 0.1) } };
  return g;
}
