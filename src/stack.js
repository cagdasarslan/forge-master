// Eşya yığınları: oyuncunun sırtı, istasyon tepsileri, tezgah rafları ve para yığınları.
// Mantıksal sayım anında değişir; görseller kavisli bir uçuşla yerine yetişir.
import * as THREE from 'three';
import { ITEMS } from './config.js';
import { makeItem } from './models.js';

let scene = null;
export function setStackScene(s) { scene = s; }

const tmp = new THREE.Vector3();
const FLY_TIME = 0.32;

// Dikey sütun (sırt): her eşya bir öncekinin üstüne
export function columnLayout(items, i, out) {
  let y = 0;
  for (let k = 0; k < i; k++) y += ITEMS[items[k].type]?.h ?? 0.06;
  return out.set(0, y, 0);
}

// Izgara: cols x rows, sonra katman katman yükselir
export function gridLayout(cols, rows, dx, dz, layerH) {
  return (items, i, out) => {
    const per = cols * rows;
    const layer = Math.floor(i / per);
    const r = i % per;
    const c = r % cols;
    const row = Math.floor(r / cols);
    return out.set((c - (cols - 1) / 2) * dx, layer * layerH, (row - (rows - 1) / 2) * dz);
  };
}

export class Stack {
  constructor(anchor, layout, cap = Infinity) {
    this.anchor = anchor;
    this.layout = layout;
    this.cap = cap;
    this.items = [];
    this.sway = 0;
  }

  get total() { return this.items.length; }
  get full() { return this.items.length >= this.cap; }
  count(type) {
    let n = 0;
    for (const it of this.items) if (it.type === type) n++;
    return n;
  }
  has(type) { return this.items.some((it) => it.type === type); }

  // Yeni eşya üret (dünya konumundan uçarak gelir)
  spawn(type, fromWorld, extra) {
    const mesh = makeItem(type);
    mesh.position.copy(fromWorld);
    scene.add(mesh);
    this._accept({ type, mesh, ...extra });
  }

  _accept(item) {
    item.flying = true;
    item.t = 0;
    item.from = item.mesh.position.clone();
    item.fromQuat = item.mesh.quaternion.clone();
    this.items.push(item);
  }

  // Bu yığından belirli türde (yoksa en üstteki) eşyayı çıkar
  take(type) {
    let idx = -1;
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!type || this.items[i].type === type) { idx = i; break; }
    }
    if (idx < 0) return null;
    const [item] = this.items.splice(idx, 1);
    scene.attach(item.mesh);
    return item;
  }

  // Bir eşyayı başka bir yığına uçur
  transferTo(other, type) {
    if (other.full) return null;
    const item = this.take(type);
    if (!item) return null;
    other._accept(item);
    return item.type;
  }

  // Eşyayı tüket: istasyona doğru küçülerek kaybolur
  consume(type, toWorld) {
    const item = this.take(type);
    if (!item) return false;
    vanish(item.mesh, toWorld);
    return true;
  }

  clear() {
    for (const it of this.items) it.mesh.removeFromParent();
    this.items.length = 0;
  }

  update(dt, sway = 0) {
    this.sway += (sway - this.sway) * Math.min(1, dt * 6);
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const local = this.layout(this.items, i, tmp);
      // yürürken sırttaki yığın hafifçe geriye eğilir
      if (this.sway) local.z -= this.sway * local.y * local.y * 0.05;
      if (it.flying) {
        it.t += dt / FLY_TIME;
        const target = this.anchor.localToWorld(local.clone());
        const k = Math.min(1, it.t);
        const e = 1 - (1 - k) * (1 - k);
        it.mesh.position.lerpVectors(it.from, target, e);
        it.mesh.position.y += Math.sin(Math.PI * k) * 1.4;
        it.mesh.rotation.y += dt * 8;
        if (k >= 1) {
          it.flying = false;
          this.anchor.attach(it.mesh);
          it.mesh.position.copy(local);
          it.mesh.rotation.set(0, 0, 0);
          it.mesh.scale.setScalar(1);
        }
      } else {
        it.mesh.position.lerp(local, Math.min(1, dt * 14));
      }
    }
  }
}

// Kaybolma efektleri (tüketilen eşyalar, toplanan paralar)
const vanishing = [];
export function vanish(mesh, toWorld, onDone) {
  vanishing.push({ mesh, from: mesh.position.clone(), to: toWorld.clone(), t: 0, s: mesh.scale.x, onDone });
}
export function vanishFollow(mesh, obj, onDone) {
  vanishing.push({ mesh, from: mesh.position.clone(), obj, t: 0, s: mesh.scale.x, onDone });
}
export function updateVanishing(dt) {
  for (let i = vanishing.length - 1; i >= 0; i--) {
    const v = vanishing[i];
    v.t += dt / 0.3;
    const k = Math.min(1, v.t);
    const to = v.obj ? v.obj.getWorldPosition(tmp).setY(tmp.y + 1.2) : v.to;
    v.mesh.position.lerpVectors(v.from, to, k);
    v.mesh.position.y += Math.sin(Math.PI * k) * 0.8;
    v.mesh.scale.setScalar(v.s * (1 - k * 0.8));
    if (k >= 1) {
      v.mesh.removeFromParent();
      vanishing.splice(i, 1);
      v.onDone?.();
    }
  }
}
