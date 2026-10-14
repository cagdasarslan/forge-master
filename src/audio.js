// Ses efektleri Web Audio ile anlık sentezlenir — harici ses dosyası yok.

class Sfx {
  constructor() {
    this.ctx = null;
    this.on = true;
    this.last = {};
  }

  // Tarayıcılar sesi ancak bir dokunuştan sonra açar
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.gain.value = this.on ? 0.5 : 0;
      this.out.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setOn(on) {
    this.on = on;
    if (this.out) this.out.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.05);
  }

  throttle(key, ms) {
    const now = performance.now();
    if (now - (this.last[key] || 0) < ms) return false;
    this.last[key] = now;
    return true;
  }

  tone(type, f0, f1, dur, vol, delay = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  burst(dur, vol, type, f, q = 1, delay = 0) {
    if (!this.ctx || !this.on) return;
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const fl = c.createBiquadFilter();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(this.out);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  // Eşya alma: yığın büyüdükçe perde yükselir
  pop(n = 0) {
    if (!this.throttle('pop', 40)) return;
    const f = 520 + Math.min(n, 24) * 28;
    this.tone('sine', f, f * 1.5, 0.08, 0.22);
  }
  drop() {
    if (!this.throttle('drop', 45)) return;
    this.tone('triangle', 380, 240, 0.07, 0.2);
  }
  chop() {
    if (!this.throttle('chop', 90)) return;
    this.burst(0.08, 0.5, 'bandpass', 900, 2);
    this.tone('square', 160, 90, 0.06, 0.12);
  }
  pick() {
    if (!this.throttle('pick', 90)) return;
    this.tone('square', 1800, 1400, 0.05, 0.08);
    this.burst(0.06, 0.4, 'highpass', 3000);
  }
  clang() {
    if (!this.throttle('clang', 120)) return;
    this.tone('triangle', 1250, 1180, 0.25, 0.12);
    this.tone('sine', 2610, 2600, 0.18, 0.06);
  }
  coin() {
    if (!this.throttle('coin', 55)) return;
    this.tone('square', 1320, 1320, 0.05, 0.07);
    this.tone('square', 1980, 1980, 0.12, 0.07, 0.05);
  }
  pay() {
    if (!this.throttle('pay', 70)) return;
    this.tone('triangle', 900, 1100, 0.06, 0.12);
  }
  unlock2() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.14, 0.08, i * 0.09));
    this.burst(0.5, 0.15, 'highpass', 6000, 1, 0.3);
  }
  buy() {
    [784, 1175].forEach((f, i) => this.tone('square', f, f, 0.09, 0.08, i * 0.06));
  }
  deny() { this.tone('sawtooth', 200, 140, 0.15, 0.08); }
  sale() {
    if (!this.throttle('sale', 200)) return;
    [1047, 1319, 1568].forEach((f, i) => this.tone('triangle', f, f, 0.08, 0.1, i * 0.05));
  }
}

export const sfx = new Sfx();
