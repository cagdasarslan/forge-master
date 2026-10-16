// Bölge bekçisi canavarlarının 3D modelleri ve zincirli arena.
// Her canavar kendi malzemelerini kullanır; böylece vurulunca yalnızca o kızarır.
import * as THREE from 'three';
import { C, mat, box, cyl } from './models.js';

function m(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, ...o });
}
function mesh(geo, material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, material);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const S = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
const CY = (rt, rb, h, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);

function eyes(head, color, y, z, dx = 0.22, size = 0.14) {
  const e = m(color, { emissive: color, emissiveIntensity: 1.6 });
  for (const s of [-1, 1]) head.add(mesh(B(size, size * 0.7, 0.06), e, s * dx, y, z));
  return e;
}

// ---------- canavarlar (yaklaşık 3-4 birim boyunda, +z yönüne bakar) ----------
const BUILD = {
  // Demir Golem: taş bloklar, turuncu çekirdek, dev yumruklar
  golem(g) {
    const stone = m(0x7f8590), dark = m(0x5d636c), core = m(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: 1.4 });
    g.body.add(mesh(B(1.9, 1.7, 1.3), stone, 0, 1.9, 0));
    g.body.add(mesh(B(1.2, 0.8, 1.0), dark, 0, 0.75, 0));
    g.body.add(mesh(new THREE.OctahedronGeometry(0.35), core, 0, 2.0, 0.66));
    for (const s of [-1, 1]) {
      g.body.add(mesh(B(0.55, 0.9, 0.6), dark, s * 0.45, 0.3, 0));
      const arm = new THREE.Group(); arm.position.set(s * 1.25, 2.4, 0);
      arm.add(mesh(B(0.55, 1.4, 0.6), stone, 0, -0.6, 0));
      arm.add(mesh(B(0.8, 0.7, 0.8), dark, 0, -1.5, 0.1));
      g.body.add(arm); g.arms.push(arm);
    }
    const head = new THREE.Group(); head.position.set(0, 3.05, 0.1);
    head.add(mesh(B(0.9, 0.7, 0.8), stone));
    g.eyes = eyes(head, 0xffa040, 0.05, 0.41);
    g.body.add(head);
    g.mats = [stone, dark];
  },
  // Bakır Basilisk: kıvrılmış bakır gövde, yeşil pas, dikilmiş baş
  serpent(g) {
    const scale = m(0xc7703a, { metalness: 0.4 }), patina = m(0x4fae8a), belly = m(0xe0b070);
    for (let i = 0; i < 14; i++) {
      const a = i * 0.55, r = 1.3 - i * 0.04;
      const s = mesh(S(0.55 - i * 0.012), i % 3 === 0 ? patina : scale, Math.cos(a) * r, 0.45 + i * 0.12, Math.sin(a) * r);
      g.body.add(s);
    }
    const neck = new THREE.Group(); neck.position.set(0.3, 2.1, 0.4);
    for (let i = 0; i < 4; i++) neck.add(mesh(S(0.42 - i * 0.03), scale, 0, i * 0.35, i * 0.12));
    const head = new THREE.Group(); head.position.set(0, 1.55, 0.55);
    head.add(mesh(B(0.8, 0.5, 1.0), scale));
    head.add(mesh(B(0.7, 0.18, 0.8), belly, 0, -0.25, 0.1));
    for (const s of [-1, 1]) head.add(mesh(new THREE.ConeGeometry(0.06, 0.3, 4).rotateX(Math.PI), m(0xffffff), s * 0.2, -0.38, 0.4));
    for (let i = 0; i < 3; i++) head.add(mesh(new THREE.ConeGeometry(0.08, 0.4, 4), patina, (i - 1) * 0.22, 0.38, -0.2));
    g.eyes = eyes(head, 0x7fff6a, 0.1, 0.51, 0.25);
    neck.add(head);
    g.body.add(neck); g.arms.push(neck);
    g.mats = [scale, patina];
  },
  // Kömür Devi: kömür karası dev, kor çatlaklar
  giant(g) {
    const coal = m(0x2a2a2e, { roughness: 0.5 }), ember = m(0xff6a1a, { emissive: 0xff4a00, emissiveIntensity: 1.3 });
    for (const s of [-1, 1]) g.body.add(mesh(CY(0.32, 0.4, 1.4), coal, s * 0.45, 0.7, 0));
    g.body.add(mesh(CY(1.0, 0.75, 1.9), coal, 0, 2.3, 0));
    for (let i = 0; i < 5; i++) g.body.add(mesh(B(0.08, 0.6, 0.05), ember, -0.5 + i * 0.25, 2.2 + (i % 2) * 0.3, 0.86));
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * 1.15, 3.0, 0);
      arm.add(mesh(CY(0.28, 0.35, 1.6), coal, 0, -0.75, 0));
      arm.add(mesh(S(0.42), coal, 0, -1.65, 0.05));
      arm.add(mesh(B(0.06, 0.5, 0.05), ember, 0, -0.8, 0.3));
      g.body.add(arm); g.arms.push(arm);
    }
    const head = new THREE.Group(); head.position.set(0, 3.6, 0.05);
    head.add(mesh(new THREE.DodecahedronGeometry(0.55), coal));
    g.eyes = eyes(head, 0xff8a2a, 0.05, 0.45, 0.2);
    g.body.add(head);
    g.mats = [coal];
  },
  // Altın Timsah: altın pullu uzun gövde, açık çene
  croc(g) {
    const gold = m(0xc9a030, { metalness: 0.6, roughness: 0.35 }), green = m(0x5a7a2a), teeth = m(0xffffff);
    g.body.add(mesh(B(1.4, 0.75, 2.6), gold, 0, 0.65, 0));
    g.body.add(mesh(B(1.0, 0.55, 1.4), green, 0, 0.55, -1.8));
    g.body.add(mesh(B(0.5, 0.35, 1.2), green, 0, 0.4, -2.9));
    for (let i = 0; i < 6; i++) g.body.add(mesh(new THREE.ConeGeometry(0.14, 0.3, 4), gold, 0, 1.12, -1.2 + i * 0.45));
    for (const sx of [-1, 1]) for (const z of [-0.8, 0.8]) g.body.add(mesh(B(0.3, 0.5, 0.35), green, sx * 0.8, 0.25, z));
    const jaw = new THREE.Group(); jaw.position.set(0, 0.85, 1.25);
    const upper = new THREE.Group(); upper.add(mesh(B(0.9, 0.3, 1.5), gold, 0, 0.1, 0.7));
    for (let i = 0; i < 5; i++) upper.add(mesh(new THREE.ConeGeometry(0.05, 0.18, 4).rotateX(Math.PI), teeth, (i % 2 ? 0.3 : -0.3), -0.12, 0.2 + i * 0.28));
    upper.rotation.x = -0.45;
    jaw.add(upper);
    const lower = new THREE.Group(); lower.add(mesh(B(0.85, 0.2, 1.4), green, 0, -0.25, 0.65)); jaw.add(lower);
    g.eyes = eyes(upper, 0xff3a3a, 0.35, 0.2, 0.32, 0.16);
    g.body.add(jaw); g.arms.push(upper);
    g.body.scale.setScalar(1.15);
    g.mats = [gold, green];
  },
  // Kristal Örümcek Kraliçesi: mor gövde, sekiz bacak, kristal dikenler
  spider(g) {
    const shell = m(0x4a3a7a), cr = m(0xb59aff, { emissive: 0x6a3ae0, emissiveIntensity: 0.8, roughness: 0.2 });
    g.body.add(mesh(S(0.85, 10, 8), shell, 0, 1.4, -0.9));
    g.body.add(mesh(S(0.55, 10, 8), shell, 0, 1.3, 0.35));
    for (let i = 0; i < 5; i++) g.body.add(mesh(new THREE.ConeGeometry(0.14, 0.7, 5), cr, Math.cos(i * 1.3) * 0.45, 2.15, -0.9 + Math.sin(i * 1.3) * 0.45));
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const leg = new THREE.Group(); leg.position.set(s * 0.4, 1.35, 0.25 - i * 0.35);
      const up = mesh(CY(0.07, 0.09, 1.3, 5), shell, 0, 0, 0); up.position.set(s * 0.55, 0.35, 0); up.rotation.z = s * -1.0; leg.add(up);
      const dn = mesh(CY(0.05, 0.07, 1.5, 5), cr, 0, 0, 0); dn.position.set(s * 1.25, -0.45, 0); dn.rotation.z = s * 0.35; leg.add(dn);
      leg.rotation.y = s * (i - 1.5) * 0.35;
      g.body.add(leg); if (i === 0) g.arms.push(leg);
    }
    const head = new THREE.Group(); head.position.set(0, 1.35, 0.85);
    head.add(mesh(S(0.32), shell));
    g.eyes = eyes(head, 0xff4a6a, 0.1, 0.27, 0.12, 0.09);
    g.body.add(head);
    g.mats = [shell, cr];
  },
  // Magma Titanı: kara kaya, lav çekirdeği, boynuzlar
  magma(g) {
    const rock = m(0x2a2220), lava = m(0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 1.5 });
    for (const s of [-1, 1]) g.body.add(mesh(B(0.6, 1.5, 0.6), rock, s * 0.55, 0.75, 0));
    g.body.add(mesh(new THREE.DodecahedronGeometry(1.25), rock, 0, 2.5, 0));
    g.body.add(mesh(new THREE.OctahedronGeometry(0.5), lava, 0, 2.5, 0.95));
    for (let i = 0; i < 6; i++) g.body.add(mesh(B(0.1, 0.7, 0.05), lava, Math.cos(i) * 0.9, 2.2 + Math.sin(i * 2) * 0.4, 0.95 - Math.abs(Math.cos(i)) * 0.3));
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * 1.35, 3.1, 0);
      arm.add(mesh(B(0.6, 1.7, 0.6), rock, 0, -0.8, 0));
      arm.add(mesh(new THREE.DodecahedronGeometry(0.5), rock, 0, -1.8, 0.1));
      arm.add(mesh(B(0.08, 0.9, 0.05), lava, 0, -0.8, 0.31));
      g.body.add(arm); g.arms.push(arm);
    }
    const head = new THREE.Group(); head.position.set(0, 3.9, 0.1);
    head.add(mesh(new THREE.DodecahedronGeometry(0.55), rock));
    for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(0.14, 0.8, 5), lava, s * 0.4, 0.55, -0.1); h.rotation.z = s * -0.5; head.add(h); }
    g.eyes = eyes(head, 0xffd36a, 0.05, 0.47, 0.2);
    g.body.add(head);
    g.mats = [rock];
  },
};

export function makeGuardian(kind) {
  const root = new THREE.Group();
  const g = { body: new THREE.Group(), arms: [], eyes: null, mats: [] };
  root.add(g.body);
  BUILD[kind](g);
  root.userData = { ...g, flash: 0, kind };
  return root;
}

// Canavarın vurulma, nefes alma ve ölüm animasyonu
export function animateGuardian(boss, dt, t, state) {
  const u = boss.userData;
  if (state === 'dead') return;
  u.flash = Math.max(0, u.flash - dt * 5);
  const breath = 1 + Math.sin(t * (state === 'fight' ? 5 : 1.6)) * 0.025;
  u.body.scale.y = breath;
  // zincirlere asılır gibi ileri geri yalpalar
  u.body.rotation.y = Math.sin(t * 0.7) * (state === 'fight' ? 0.25 : 0.12);
  u.body.position.x = Math.sin(t * 9) * 0.06 * u.flash;
  u.arms.forEach((a, i) => { a.rotation.x = Math.sin(t * (state === 'fight' ? 4 : 1.2) + i * 1.7) * (state === 'fight' ? 0.5 : 0.18); });
  for (const mm of u.mats) mm.emissive.setRGB(u.flash * 0.9, u.flash * 0.1, u.flash * 0.05);
}

// ---------- zincirli arena ----------
// Taş halka, dört direk ve direklerden canavara uzanan zincirler
export function makeArena(radius = 3.2) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.15, 0.12, 24), mat(0x6a6460));
  ring.position.y = 0.06; ring.receiveShadow = true; g.add(ring);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.35, radius - 0.35, 0.14, 24), mat(0x4e4844));
  inner.position.y = 0.07; inner.receiveShadow = true; g.add(inner);
  // rünler
  const rune = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.9, 0.05, 4, 32).rotateX(Math.PI / 2), mat(0xc23b30, { emissive: 0x6a1010, emissiveIntensity: 0.8 }));
  rune.position.y = 0.16; g.add(rune);
  const posts = [];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * (radius - 0.25), 0, Math.sin(a) * (radius - 0.25));
    g.add(cyl(0.22, 0.3, 2.4, 6, 0x4a4440, p.x, 1.2, p.z));
    g.add(cyl(0.3, 0.3, 0.18, 6, C.ironDark, p.x, 2.35, p.z, { metalness: 0.6 }));
    posts.push(p.setY(2.2));
  }
  g.userData = { posts, chains: [] };
  return g;
}

// İki nokta arasında halka halka zincir
export function makeChain(from, to) {
  const g = new THREE.Group();
  const dir = to.clone().sub(from);
  const len = dir.length();
  const n = Math.max(4, Math.round(len / 0.24));
  const linkMat = mat(C.ironDark, { metalness: 0.7, roughness: 0.35 });
  const geo = new THREE.TorusGeometry(0.1, 0.03, 4, 8);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const p = from.clone().lerp(to, k);
    p.y -= Math.sin(k * Math.PI) * 0.35; // sarkma
    const l = new THREE.Mesh(geo, linkMat);
    l.position.copy(p);
    l.lookAt(to);
    l.rotateZ(i % 2 ? Math.PI / 2 : 0);
    g.add(l);
  }
  return g;
}

export { box };
