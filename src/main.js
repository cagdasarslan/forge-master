import * as THREE from 'three';
import './style.css';
import './map.css';
import './monetization.css';
import { Game } from './game.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { Profile } from './profile.js';
import { regionById } from './regions/index.js';
import * as SIM from './sim.js';

const app = document.getElementById('app');

// zemindeki yazılar canvas'a çizildiği için önce yazı tipini bekle (çevrimdışıysa en fazla 1.5 sn)
await Promise.race([
  Promise.all([document.fonts.load('30px "Lilita One"'), document.fonts.load('30px "Pirata One"')]).catch(() => {}),
  new Promise((r) => setTimeout(r, 1500)),
]);

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.prepend(renderer.domElement);

// ---------- Profil ve bölge ----------
const profile = new Profile();
const region = regionById(profile.current);
const offline = profile.collectOffline();

const scene = new THREE.Scene();
scene.background = new THREE.Color(region.theme.sky);
scene.fog = new THREE.Fog(region.theme.sky, 34, 60);

const camera = new THREE.PerspectiveCamera(32, 1, 1, 160);

// ---------- Işıklar ----------
// bölge ışığı: varsayılanın çarpanı (mağarada karanlık, dağda sıcak)
const LIGHT = region.light || {};
scene.add(new THREE.HemisphereLight(0xfff4e0, LIGHT.lantern ? 0x1a1626 : 0x5a7a3a, 1.35 * (LIGHT.hemi ?? 1)));
const sun = new THREE.DirectionalLight(LIGHT.lantern ? 0x9a8aff : 0xffe6c0, 2.3 * (LIGHT.sun ?? 1));
renderer.toneMappingExposure = LIGHT.exposure ?? 1.05;
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -20; sc.right = 20; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 70;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const SUN_OFF = new THREE.Vector3(-9, 20, 10);

// ---------- Oyun ----------
const ui = new UI(app);
ui.camera = camera;
ui.profile = profile;
const game = new Game(scene, ui, profile, region);
ui.game = game;
if (LIGHT.lantern) {
  // karanlık bölgede oyuncunun feneri
  const lamp = new THREE.PointLight(0xffd9a0, 45, 12, 1.3);
  lamp.position.set(0, 2.3, 0.5);
  game.player.char.add(lamp);
}
// bölge değiştirirken kaydet ve sahneyi yeni bölgeyle baştan kur
ui.onTravel = (id) => {
  game.save();
  profile.current = id;
  profile.save();
  location.reload();
};
ui.openMenu(); // açılışta ana menü
if (offline && Object.keys(offline.gained).length) ui.offlinePopup(offline);
// haftalık sefer: süre dolduysa yeni düşman
const rolled = profile.ensureCampaign();
if (rolled.length) { profile.save(); ui.weekPopup(rolled); }
setInterval(() => {
  const r = profile.ensureCampaign();
  if (r.length) { profile.save(); ui.weekPopup(r); }
  ui.setSefer();
}, 30000);
const input = new Input(app, ui.el.joy, () => ui.panelOpen);

// kamera: izometriğe yakın, oyuncuyu yumuşakça takip eder
const camTarget = new THREE.Vector3().copy(game.player.pos);
const CAM_DIR = new THREE.Vector3(0, 1.25, 1).normalize();
let camDist = 21;

function resize() {
  const w = app.clientWidth, h = app.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // ekran genişliğinde ~11 birim görünecek kadar uzaklaş (dikey telefonda daha uzak)
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camDist = THREE.MathUtils.clamp(5.6 / (halfTan * camera.aspect), 22, 46);
  scene.fog.near = camDist + 8;
  scene.fog.far = camDist + 45;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
new ResizeObserver(resize).observe(app);
resize();

function placeCamera(dt) {
  const p = game.player.pos;
  const k = dt ? Math.min(1, dt * 5) : 1;
  camTarget.x += (p.x - camTarget.x) * k;
  camTarget.z += (p.z - 1.2 - camTarget.z) * k;
  camera.position.copy(camTarget).addScaledVector(CAM_DIR, window.camOverride || camDist); // geliştirme: camOverride ile uzaklaş
  camera.lookAt(camTarget);
  sun.position.copy(camTarget).add(SUN_OFF);
  sun.target.position.copy(camTarget);
}
placeCamera(0);

document.addEventListener('visibilitychange', () => { if (document.hidden) game.save(); });
addEventListener('pagehide', () => game.save());

// ---------- Döngü ----------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  const mv = ui.panelOpen ? { x: 0, z: 0 } : input.read();
  game.update(dt, mv);
  placeCamera(dt);
  renderer.render(scene, camera);
  ui.update(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// geliştirme kolaylığı: konsoldan game.gold += 1000, stepGame(10, {x:1,z:0}) ile zamanı ileri sar
window.game = game;
window.profile = profile;
window.sim = {
  run: (h, o) => SIM.run(game, h, o),
  until: (l, m) => SIM.until(game, l, m),
  // kampanya simülasyonu: bu bölgede 3. siparişe kadar oyna, sonucu kaydet, sıradaki bölgeye geç
  // olgun bölgenin Ambar'a saatlik gönderimini ölç
  async rate(next, hours = 1) {
    const t = region.exports;
    const a0 = profile.ambar(t);
    await SIM.run(game, hours, { report: 9999 });
    const R = JSON.parse(localStorage.getItem('sim.rates') || '{}');
    R[region.id] = Math.round((profile.ambar(t) - a0) / hours);
    localStorage.setItem('sim.rates', JSON.stringify(R));
    game.save();
    if (next) { profile.current = next; profile.save(); }
    return R;
  },
  // haftanın silahı için bu bölgenin malından eksik kalanı üret, sonra Ambar'dan silaha aktar
  async farm(next) {
    const t = region.exports;
    const need = profile.boss().parts.reduce((s, p) => s + Math.max(0, (p.needs[t] || 0) - profile.given(p.id, t)), 0);
    const t0 = game.simTime || 0;
    while (profile.ambar(t) < need && (game.simTime || 0) - t0 < 6 * 3600) await SIM.run(game, 0.05, { report: 9999 });
    for (const p of profile.boss().parts) profile.contribute(p.id);
    const L = JSON.parse(localStorage.getItem('sim.log') || '[]');
    L.push({ region: region.id + ' (silah)', mins: Math.round(((game.simTime || 0) - t0) / 60), need, ready: profile.weaponReady(), ambar: { ...profile.data.capital } });
    localStorage.setItem('sim.log', JSON.stringify(L));
    game.save();
    if (next) { profile.current = next; profile.save(); }
    return L;
  },
  async step(next, level = 3) {
    const mins = await SIM.until(game, level, 8);
    // bekçi: yenilene kadar oyna (asker topla, saldır)
    const t0 = game.simTime || 0;
    while (!game.rs.guardianDefeated && (game.simTime || 0) - t0 < 6 * 3600) await SIM.run(game, 0.05, { report: 9999 });
    const gmins = Math.round(((game.simTime || 0) - t0) / 60);
    const L = JSON.parse(localStorage.getItem('sim.log') || '[]');
    L.push({ region: region.id, mins: mins + gmins, orderMins: mins, guardianMins: gmins, army: game.armyPower(), gold: Math.floor(game.gold), workers: game.workers.length, ambar: { ...profile.data.capital } });
    localStorage.setItem('sim.log', JSON.stringify(L));
    game.save();
    if (next) { profile.current = next; profile.save(); }
    return L;
  },
};
window.stepGame = (sec, mv = { x: 0, z: 0 }) => {
  for (let t = 0; t < sec; t += 1 / 30) { game.update(1 / 30, mv); placeCamera(1 / 30); ui.update(1 / 30); }
  renderer.render(scene, camera);
};
