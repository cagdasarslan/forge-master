// Basit parçacık sistemi: kıvılcım, duman, yaprak, taş kırıntısı, altın parıltısı.
import * as THREE from 'three';

const geo = {
  cube: new THREE.BoxGeometry(0.1, 0.1, 0.1),
  ball: new THREE.IcosahedronGeometry(0.22, 0),
  leaf: new THREE.PlaneGeometry(0.18, 0.12),
};

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    this.mats = {};
  }

  m(color, opts = {}) {
    const k = color + (opts.glow ? 'g' : '') + (opts.fade ? 'f' : '');
    if (!this.mats[k]) {
      this.mats[k] = opts.glow
        ? new THREE.MeshBasicMaterial({ color, transparent: true })
        : new THREE.MeshStandardMaterial({ color, flatShading: true, transparent: !!opts.fade, roughness: 1, side: THREE.DoubleSide });
    }
    return this.mats[k];
  }

  emit(pos, { n = 6, color = 0xffffff, geo: gk = 'cube', speed = 3, up = 3, life = 0.7, gravity = 9, scale = 1, glow = false, fade = false, grow = 0, dir = null, spread = 0 }) {
    for (let i = 0; i < n; i++) {
      if (this.parts.length > 260) return;
      const mesh = new THREE.Mesh(geo[gk], fade ? this.m(color, { glow, fade }).clone() : this.m(color, { glow }));
      mesh.position.copy(pos);
      mesh.scale.setScalar(scale * (0.7 + Math.random() * 0.6));
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.scene.add(mesh);
      // yönlü fışkırma (ör. ejderha ateşi) ya da her yöne saçılma
      const v = dir
        ? dir.clone().multiplyScalar(speed).add(new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread))
        : new THREE.Vector3(Math.cos(a) * s, up * (0.6 + Math.random() * 0.6), Math.sin(a) * s);
      this.parts.push({
        mesh, life, t: 0, gravity, fade, grow, s0: mesh.scale.x,
        v,
        spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      });
    }
  }

  sparks(pos) { this.emit(pos, { n: 7, color: 0xffb347, glow: true, speed: 3.2, up: 4, life: 0.45, gravity: 14, scale: 0.6 }); }
  chips(pos, color) { this.emit(pos, { n: 5, color, speed: 2.2, up: 3.2, life: 0.55, gravity: 12, scale: 0.9 }); }
  leaves(pos) { this.emit(pos, { n: 4, color: 0x5fae3f, geo: 'leaf', speed: 1.4, up: 1.5, life: 1.1, gravity: 2.5 }); }
  smoke(pos) { this.emit(pos, { n: 1, color: 0x9a9590, geo: 'ball', speed: 0.3, up: 1.2, life: 1.8, gravity: -0.3, fade: true, grow: 1.4, scale: 0.8 }); }
  confetti(pos) {
    for (const c of [0xf2c230, 0xe85a4f, 0x4fa3e8, 0x6fd06a]) this.emit(pos, { n: 8, color: c, geo: 'leaf', speed: 4.5, up: 7, life: 1.4, gravity: 9 });
  }
  glint(pos) { this.emit(pos, { n: 5, color: 0xffe27a, glow: true, speed: 1.6, up: 2.5, life: 0.5, gravity: 4, scale: 0.5 }); }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.t += dt;
      if (p.t >= p.life) {
        p.mesh.removeFromParent();
        if (p.fade) p.mesh.material.dispose();
        this.parts.splice(i, 1);
        continue;
      }
      p.v.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      if (p.mesh.position.y < 0.03) { p.mesh.position.y = 0.03; p.v.set(p.v.x * 0.5, 0, p.v.z * 0.5); }
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      const k = p.t / p.life;
      if (p.fade) p.mesh.material.opacity = 0.7 * (1 - k);
      if (p.grow) p.mesh.scale.setScalar(p.s0 * (1 + p.grow * k));
      else if (k > 0.6) p.mesh.scale.setScalar(p.s0 * (1 - (k - 0.6) / 0.4));
    }
  }
}
