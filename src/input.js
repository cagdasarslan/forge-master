// Dokunmatik joystick (ekranın herhangi bir yerinden sürükle) + klavye (WASD / ok tuşları).
import { sfx } from './audio.js';

export class Input {
  constructor(surface, joyEl, isBlocked) {
    this.x = 0;
    this.z = 0;
    this.keys = new Set();
    this.id = null;
    this.origin = { x: 0, y: 0 };
    this.joy = joyEl;
    this.knob = joyEl.querySelector('.joy-knob');
    this.R = 52;
    this.touched = false;

    surface.addEventListener('pointerdown', (e) => {
      sfx.unlock();
      if (isBlocked() || this.id !== null) return;
      if (e.target.closest('button, #panel')) return;
      this.id = e.pointerId;
      this.touched = true;
      const r = surface.getBoundingClientRect();
      this.rect = r;
      this.origin = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.joy.hidden = false;
      this.joy.style.transform = `translate(${this.origin.x}px, ${this.origin.y}px)`;
      this.knob.style.transform = 'translate(-50%, -50%)';
      surface.setPointerCapture?.(e.pointerId);
    });
    surface.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.id) return;
      let dx = e.clientX - this.rect.left - this.origin.x;
      let dy = e.clientY - this.rect.top - this.origin.y;
      const d = Math.hypot(dx, dy);
      if (d > this.R) {
        // parmak çok uzaklaşırsa joystick peşinden gelir
        const k = (d - this.R) / d;
        this.origin.x += dx * k; this.origin.y += dy * k;
        dx *= this.R / d; dy *= this.R / d;
        this.joy.style.transform = `translate(${this.origin.x}px, ${this.origin.y}px)`;
      }
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const m = Math.min(1, d / this.R);
      const s = m < 0.15 ? 0 : 1; // küçük titremeler yok sayılır, aksi halde tam hız
      const l = Math.hypot(dx, dy) || 1;
      this.x = (dx / l) * s;
      this.z = (dy / l) * s;
    });
    const end = (e) => {
      if (e.pointerId !== this.id) return;
      this.id = null;
      this.x = this.z = 0;
      this.joy.hidden = true;
    };
    surface.addEventListener('pointerup', end);
    surface.addEventListener('pointercancel', end);

    addEventListener('keydown', (e) => { this.keys.add(e.code); sfx.unlock(); });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  read() {
    if (this.id !== null) return { x: this.x, z: this.z };
    const k = this.keys;
    let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let z = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    const l = Math.hypot(x, z);
    if (l > 0) { x /= l; z /= l; }
    return { x, z };
  }
}
