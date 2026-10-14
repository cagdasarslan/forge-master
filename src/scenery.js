// Bölgeye özgü zemin dokuları ve arka planlar: her bölge krallığın farklı bir köşesi gibi görünsün.
import * as THREE from 'three';
import { C, mat, sh, box, cyl, makeTree, makeRock, makeCrystalCluster, makeLavaPool, makeWall } from './models.js';

// ---------- zemin dokuları ----------
function rnd(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const FLOORS = {
  dirt(g, S, r) {
    g.fillStyle = '#c9a06a'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(150,105,60,.35)' : 'rgba(230,200,150,.3)'; g.fillRect(r() * S, r() * S, 2 + r() * 5, 2 + r() * 4); }
    for (let i = 0; i < 40; i++) { g.fillStyle = '#a98a63'; g.beginPath(); g.ellipse(r() * S, r() * S, 4 + r() * 6, 3 + r() * 4, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 30; i++) { g.strokeStyle = '#7fae4a'; g.lineWidth = 2; const x = r() * S, y = r() * S; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 2, y); g.lineTo(x + k * 2 + (r() - 0.5) * 6, y - 6 - r() * 5); g.stroke(); } }
  },
  earth(g, S, r) {
    g.fillStyle = '#b8805a'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(140,80,50,.35)' : 'rgba(220,160,110,.3)'; g.fillRect(r() * S, r() * S, 3 + r() * 6, 2 + r() * 4); }
    g.strokeStyle = 'rgba(110,60,35,.6)'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 50; i++) { g.fillStyle = r() < 0.3 ? '#d9813a' : '#8a7a6c'; g.beginPath(); g.arc(r() * S, r() * S, 2 + r() * 5, 0, 7); g.fill(); }
  },
  cobble(g, S, r) {
    g.fillStyle = '#4e4a46'; g.fillRect(0, 0, S, S);
    const n = 12, cs = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const ox = (y % 2) * cs * 0.5;
      const cx = x * cs + ox + cs / 2, cy = y * cs + cs / 2;
      const shade = 120 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
      g.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + r() * 0.3; const rr = cs * (0.38 + r() * 0.08); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(cx - cs * 0.1, cy - cs * 0.1, cs * 0.15, 0, 7); g.fill();
    }
  },
  sand(g, S, r) {
    g.fillStyle = '#e6cf98'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(190,160,100,.45)'; g.lineWidth = 3;
    for (let i = 0; i < 30; i++) { const y = r() * S; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= S; x += 32) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 6); g.stroke(); }
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.1 ? '#f2c230' : '#b8a48a'; g.beginPath(); g.arc(r() * S, r() * S, 1.5 + r() * 4, 0, 7); g.fill(); }
  },
  cave(g, S, r) {
    g.fillStyle = '#2e2b38'; g.fillRect(0, 0, S, S);
    const n = 8, cs = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const shade = 50 + Math.floor(r() * 18);
      g.fillStyle = `rgb(${shade},${shade - 3},${shade + 12})`;
      g.fillRect(x * cs + 3, y * cs + 3, cs - 6 - r() * 8, cs - 6 - r() * 8);
    }
    for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,230,255,.6)' : 'rgba(180,140,255,.55)'; g.beginPath(); g.arc(r() * S, r() * S, 1.5 + r() * 3, 0, 7); g.fill(); }
  },
  ash(g, S, r) {
    g.fillStyle = '#3a302c'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 800; i++) { g.fillStyle = r() < 0.5 ? 'rgba(20,15,15,.4)' : 'rgba(110,90,80,.3)'; g.fillRect(r() * S, r() * S, 3 + r() * 6, 2 + r() * 4); }
  },
};

// Kül zeminindeki parlayan lav çatlakları (emissive harita)
function cracks(S, r) {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  g.strokeStyle = '#ff6a1a'; g.lineWidth = 3; g.shadowColor = '#ff4a00'; g.shadowBlur = 8;
  for (let i = 0; i < 14; i++) {
    let x = r() * S, y = r() * S;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}

export function makeFloor(kind, w, d) {
  const S = 512;
  const r = rnd(kind.length * 31 + 7);
  const c = document.createElement('canvas');
  c.width = c.height = S;
  FLOORS[kind](c.getContext('2d'), S, r);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 7, d / 7);
  tex.anisotropy = 4;
  const opts = { map: tex, roughness: 1 };
  if (kind === 'ash') {
    const e = new THREE.CanvasTexture(cracks(S, r));
    e.wrapS = e.wrapT = THREE.RepeatWrapping;
    e.repeat.copy(tex.repeat);
    Object.assign(opts, { emissive: 0xffffff, emissiveMap: e, emissiveIntensity: 0.9 });
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial(opts));
  m.receiveShadow = true;
  return m;
}

// ---------- arka plan parçaları ----------
function cottage(roof = 0x9c4a2e, wall = 0xe9dcc0) {
  const g = new THREE.Group();
  g.add(box(2.6, 1.6, 2.0, wall, 0, 0.8, 0));
  for (const x of [-1.25, 1.25]) g.add(box(0.12, 1.6, 2.05, C.woodDark, x, 0.8, 0));
  const r = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.7, 1.2, 4), mat(roof)));
  r.rotation.y = Math.PI / 4; r.position.y = 2.2; r.scale.set(1.15, 1, 0.85); g.add(r);
  g.add(box(0.5, 0.9, 0.06, C.woodDark, 0, 0.45, 1.01));
  g.add(box(0.4, 0.35, 0.06, 0xffd27a, 0.75, 1.0, 1.01, { emissive: 0xffa040, emissiveIntensity: 0.4 }));
  g.add(box(0.25, 0.9, 0.25, C.stoneDark, -0.7, 2.6, -0.3));
  return g;
}

function windmill() {
  const g = new THREE.Group();
  g.add(cyl(0.9, 1.3, 4.2, 8, 0xe9dcc0, 0, 2.1, 0));
  const r = sh(new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.2, 8), mat(0x9c4a2e)));
  r.position.y = 4.8; g.add(r);
  const hub = new THREE.Group(); hub.position.set(0, 3.9, 1.05);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group(); arm.rotation.z = (i / 4) * Math.PI * 2;
    arm.add(box(0.12, 2.6, 0.08, C.woodDark, 0, 1.3, 0));
    arm.add(box(0.7, 2.1, 0.04, 0xf3e3c3, 0.4, 1.5, 0));
    hub.add(arm);
  }
  g.add(hub);
  return { g, spin: { obj: hub, axis: 'z', speed: 0.8 } };
}

function haystack() {
  const m = sh(new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe2c060)));
  m.scale.y = 1.2;
  return m;
}

function field(w, d, color) {
  const g = new THREE.Group();
  for (let i = 0; i < Math.floor(d / 0.8); i++) g.add(box(w, 0.2, 0.4, i % 2 ? color : 0x8a6a3a, 0, 0.1, -d / 2 + i * 0.8));
  return g;
}

function hill(r, color, h = 0.55) {
  const m = sh(new THREE.Mesh(new THREE.SphereGeometry(r, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(color)), true);
  m.scale.y = h;
  return m;
}

function cliff(w, h, colors) {
  const g = new THREE.Group();
  colors.forEach((c, i) => g.add(box(w - i * 0.8, h / colors.length, 2.2 - i * 0.3, c, (i % 2) * 0.4, (i + 0.5) * (h / colors.length), -i * 0.2)));
  return g;
}

function tower(color = 0x8d877e) {
  const g = new THREE.Group();
  g.add(cyl(1.3, 1.5, 5.5, 8, color, 0, 2.75, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(box(0.45, 0.5, 0.45, color, Math.cos(a) * 1.25, 5.75, Math.sin(a) * 1.25));
  }
  const r = sh(new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 8), mat(0x2f4f9a)));
  r.position.y = 7.0; g.add(r);
  g.add(box(0.06, 1.0, 0.06, C.woodDark, 0, 8.3, 0));
  g.add(box(0.5, 0.35, 0.04, C.gold, 0.27, 8.55, 0));
  return g;
}

function keep() {
  const g = new THREE.Group();
  g.add(box(9, 6, 5, 0x8d877e, 0, 3, 0));
  for (let i = 0; i < 10; i++) g.add(box(0.6, 0.6, 5.2, 0x8d877e, -4.2 + i * 0.93, 6.3, 0));
  for (const x of [-4.5, 4.5]) { const t = tower(0x7c766e); t.position.set(x, 0, 0); t.scale.setScalar(1.15); g.add(t); }
  const t = tower(0x7c766e); t.position.set(0, 2, -1); t.scale.setScalar(1.3); g.add(t);
  g.add(box(1.6, 2.4, 0.2, 0x3a2414, 0, 1.2, 2.55));
  return g;
}

function boat() {
  const g = new THREE.Group();
  const hull = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.3, 2.4, 6, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2), mat(C.wood, { side: THREE.DoubleSide })));
  hull.rotation.y = Math.PI / 2; hull.position.y = 0.35; g.add(hull);
  g.add(box(0.08, 1.6, 0.08, C.woodDark, 0, 1.1, 0));
  g.add(box(0.05, 1.1, 0.9, 0xf3e3c3, 0.02, 1.3, 0.1));
  return g;
}

function reeds() {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1 + Math.random() * 0.6, 4), mat(0x7a9a3a));
    r.position.set((Math.random() - 0.5) * 0.6, 0.5, (Math.random() - 0.5) * 0.6); r.rotation.z = (Math.random() - 0.5) * 0.3;
    g.add(r);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 5), mat(0x6b4226));
    top.position.set(r.position.x, 1.1, r.position.z); g.add(top);
  }
  return g;
}

function waterwheel() {
  const g = new THREE.Group();
  const wheel = new THREE.Group(); wheel.position.y = 1.2;
  wheel.add(sh(new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 6, 14).rotateY(Math.PI / 2), mat(C.wood))));
  for (let i = 0; i < 8; i++) { const p = box(0.1, 2.2, 0.35, C.plank, 0, 0, 0); p.rotation.x = (i / 8) * Math.PI; wheel.add(p); }
  g.add(wheel);
  g.add(box(0.3, 2.2, 0.3, C.woodDark, 0, 1.1, -0.9));
  return { g, spin: { obj: wheel, axis: 'x', speed: 1.2 } };
}

function caveWall(s, color = 0x2a2733) {
  const m = sh(new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat(color)), true);
  m.scale.set(1, 1.8 + Math.random(), 1);
  m.position.y = s * 0.8;
  return m;
}

function mushroom(color) {
  const g = new THREE.Group();
  g.add(cyl(0.06, 0.08, 0.4, 5, 0xd8d0e8, 0, 0.2, 0));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { emissive: color, emissiveIntensity: 0.9 }));
  cap.position.y = 0.38; g.add(cap);
  return g;
}

function volcano(h, r) {
  const g = new THREE.Group();
  const cone = sh(new THREE.Mesh(new THREE.ConeGeometry(r, h, 8, 1, true), mat(0x3a2c28)), true);
  cone.position.y = h / 2; g.add(cone);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r * 0.22, 0.5, 8), mat(0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 1.5 }));
  top.position.y = h * 0.92; g.add(top);
  for (let i = 0; i < 3; i++) {
    const lv = new THREE.Mesh(new THREE.BoxGeometry(0.4, h * 0.45, 0.15), mat(0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 1.2 }));
    const a = i * 2.1;
    lv.position.set(Math.cos(a) * r * 0.42, h * 0.62, Math.sin(a) * r * 0.42 + 0.2);
    lv.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5);
    g.add(lv);
  }
  return g;
}

function deadTree() {
  const g = new THREE.Group();
  g.add(cyl(0.1, 0.18, 2.2, 5, 0x2a2220, 0, 1.1, 0));
  for (let i = 0; i < 3; i++) {
    const b = cyl(0.04, 0.07, 1.0, 4, 0x2a2220, 0, 1.4 + i * 0.3, 0);
    b.rotation.z = (i % 2 ? 1 : -1) * 0.9; b.position.x = (i % 2 ? -0.3 : 0.3);
    g.add(b);
  }
  return g;
}

function spike() {
  const m = sh(new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2 + Math.random() * 1.5, 5), mat(0x1e1a24, { roughness: 0.3 })));
  m.position.y = 1.1;
  m.rotation.z = (Math.random() - 0.5) * 0.3;
  return m;
}

// Her bölgenin arka planı: oyun alanının dışında kalan, bölgeyi tanıtan yapılar.
// Döndürür: dönen parçalar (yel değirmeni, su çarkı) listesi
export function buildBackdrop(scene, region, rng) {
  const spin = [];
  const add = (o, x, z, ry = 0, s = 1) => { o.position.set(x, o.position.y, z); o.rotation.y = ry; if (s !== 1) o.scale.setScalar(s); scene.add(o); return o; };
  switch (region.theme.backdrop) {
    case 'village': {
      add(cottage(), -19, -4, 0.4); add(cottage(0x6a3a2a), 19, 3, -0.6); add(cottage(0x9c4a2e, 0xf0e4c8), -19.5, 11, 1.2);
      add(cottage(0x7a2e2e), 18.5, -11, -1.1); add(cottage(), -6, -26, 0.2); add(cottage(0x6a3a2a), 8, -27, -0.3);
      const wm = windmill(); add(wm.g, 22, -18, -0.5); spin.push(wm.spin);
      add(field(6, 6, 0xd9c060), -24, 4, 0.1); add(field(5, 7, 0x8ab84a), 24, 10, -0.2);
      for (const [x, z] of [[-20, -10], [20.5, -6], [-21, 15], [21, 15]]) add(haystack(), x, z);
      break;
    }
    case 'hills': {
      for (let i = 0; i < 9; i++) add(hill(5 + rng() * 4, i % 2 ? 0x7fb247 : 0x9a8a4a), -26 + i * 6.5, -30 - rng() * 4);
      for (const [x, z] of [[-23, -8], [23, 4], [-24, 10], [24, -14]]) add(hill(4 + rng() * 2, 0x8cbf4f), x, z);
      add(cliff(12, 4.5, [0xa0603a, 0xb5703a, 0xc4844a]), -2, -23.5);
      add(cliff(8, 3.5, [0x8a6a5a, 0x9a7a6a]), 13, -15, -0.4);
      for (let i = 0; i < 6; i++) { const row = field(0.4, 5, 0x6a9a3a); add(row, -22 + i * 1.1, -16, 0); }
      break;
    }
    case 'castle': {
      add(makeWall(30), -17, -6, Math.PI / 2); add(makeWall(22), 17, -10, Math.PI / 2);
      add(makeWall(12), -10, -24, 0); add(makeWall(12), 10, -24, 0);
      add(keep(), 0, -30);
      for (const [x, z] of [[-17, -22], [17, -22], [-17, 10], [17, 2]]) add(tower(), x, z);
      break;
    }
    case 'river': {
      const rv = region.layout.river;
      for (let i = 0; i < 4; i++) {
        const dock = new THREE.Group();
        dock.add(box(2.2, 0.12, 0.9, C.plank, 0, 0.3, 0));
        for (const x of [-0.9, 0.9]) dock.add(box(0.12, 0.6, 0.12, C.woodDark, x, 0.1, 0.4));
        add(dock, rv.x + rv.w / 2 + 1.0, -20 + i * 9);
      }
      add(boat(), rv.x, -12, 0.2); add(boat(), rv.x + 0.2, 6, -0.3); add(boat(), rv.x - 0.1, 24, 0.1);
      const ww = waterwheel(); add(ww.g, rv.x - rv.w / 2 - 0.4, -1.5); spin.push(ww.spin);
      for (let i = 0; i < 14; i++) add(reeds(), rv.x + (rng() < 0.5 ? -1 : 1) * (rv.w / 2 + 0.6), -24 + rng() * 40);
      for (let i = 0; i < 6; i++) add(reeds(), 13 + rng() * 6, -20 + rng() * 30);
      add(cottage(0x3a6a9a), 16.5, -6, -1.2); add(cottage(0x3a6a9a, 0xf0e4c8), 17, 6, -1.6);
      break;
    }
    case 'cave': {
      for (let i = 0; i < 26; i++) {
        const side = i % 3;
        const x = side === 0 ? -17.5 - rng() * 4 : side === 1 ? 17.5 + rng() * 4 : -20 + rng() * 40;
        const z = side === 2 ? -24 - rng() * 4 : -24 + rng() * 40;
        add(caveWall(2 + rng() * 2, i % 2 ? 0x2a2733 : 0x322e3c), x, z);
      }
      const cols = [0x4fc3ff, 0xb59aff, 0x7fffd0];
      for (let i = 0; i < 24; i++) {
        const x = (rng() < 0.5 ? -1 : 1) * (14 + rng() * 4), z = -20 + rng() * 34;
        add(mushroom(cols[i % 3]), x, z, 0, 0.8 + rng() * 0.8);
      }
      for (let i = 0; i < 8; i++) add(makeCrystalCluster(cols[i % 3], 1.4 + rng()), -16 + rng() * 32, -22 - rng() * 3);
      break;
    }
    case 'volcano': {
      add(volcano(14, 7), -12, -36); add(volcano(18, 9), 8, -40); add(volcano(10, 5), 24, -28); add(volcano(11, 6), -26, -26);
      for (let i = 0; i < 10; i++) add(deadTree(), (rng() < 0.5 ? -1 : 1) * (15.5 + rng() * 5), -20 + rng() * 34, rng() * 6);
      for (let i = 0; i < 14; i++) add(spike(), (rng() < 0.5 ? -1 : 1) * (16 + rng() * 6), -24 + rng() * 38);
      add(makeLavaPool(2.2), -19, -2); add(makeLavaPool(1.8), 20, 8);
      const river = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 40).rotateX(-Math.PI / 2), mat(0xff5a1a, { emissive: 0xff3a00, emissiveIntensity: 1.2 }));
      river.position.set(22, 0.03, -6); river.rotation.y = 0.25; scene.add(river);
      break;
    }
  }
  return spin;
}

export { rnd };
