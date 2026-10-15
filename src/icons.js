// Arayüz simgeleri: açılışta küçük bir canvas'a çizilip data URL olarak saklanır (harici görsel yok).

const S = 96;
const cache = {};

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function outline(g, fill, w = 5) {
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = w;
  g.strokeStyle = '#2a1a10';
  g.stroke();
}

function rockIcon(g, rock, speck, extra) {
  g.beginPath();
  g.moveTo(20, 60); g.lineTo(28, 30); g.lineTo(52, 20); g.lineTo(76, 34); g.lineTo(80, 62); g.lineTo(56, 78); g.lineTo(30, 76);
  g.closePath(); outline(g, rock);
  g.fillStyle = speck;
  [[40, 44, 7], [60, 56, 6], [56, 36, 5], [36, 62, 4]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  if (extra) { g.fillStyle = extra; g.beginPath(); g.arc(46, 54, 4, 0, 7); g.fill(); }
}

const DRAW = {
  wood(g) {
    g.save(); g.translate(48, 50); g.rotate(-0.35);
    rr(g, -36, -14, 64, 28, 6); outline(g, '#9a6233');
    g.beginPath(); g.ellipse(30, 0, 9, 14, 0, 0, Math.PI * 2); outline(g, '#e2b07a');
    g.strokeStyle = '#a8703c'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(30, 0, 4, 7, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
  },
  ore(g) {
    g.beginPath();
    g.moveTo(20, 60); g.lineTo(28, 30); g.lineTo(52, 20); g.lineTo(76, 34); g.lineTo(80, 62); g.lineTo(56, 78); g.lineTo(30, 76);
    g.closePath(); outline(g, '#6f6a66');
    g.fillStyle = '#e07a3a';
    [[40, 44, 7], [60, 56, 6], [56, 36, 5], [36, 62, 4]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  },
  coal(g) {
    g.beginPath();
    g.moveTo(22, 58); g.lineTo(32, 28); g.lineTo(58, 22); g.lineTo(78, 40); g.lineTo(72, 70); g.lineTo(44, 78);
    g.closePath(); outline(g, '#2b2b2e');
    g.fillStyle = '#55555c'; g.beginPath(); g.moveTo(36, 34); g.lineTo(56, 28); g.lineTo(46, 46); g.fill();
  },
  ingot(g) {
    g.beginPath(); g.moveTo(14, 66); g.lineTo(26, 38); g.lineTo(78, 38); g.lineTo(84, 66); g.closePath(); outline(g, '#b8c2cc');
    g.beginPath(); g.moveTo(26, 38); g.lineTo(34, 28); g.lineTo(84, 28); g.lineTo(78, 38); g.closePath(); outline(g, '#e3e9ef');
  },
  sword(g) {
    g.save(); g.translate(48, 48); g.rotate(-Math.PI / 4);
    g.beginPath(); g.moveTo(-6, -8); g.lineTo(-6, -40); g.lineTo(0, -48); g.lineTo(6, -40); g.lineTo(6, -8); g.closePath(); outline(g, '#dfe6ee', 4);
    rr(g, -20, -10, 40, 9, 3); outline(g, '#f2c230', 4);
    rr(g, -4, -1, 8, 24, 2); outline(g, '#7a4a25', 4);
    g.beginPath(); g.arc(0, 28, 6, 0, 7); outline(g, '#f2c230', 4);
    g.restore();
  },
  shield(g) {
    g.beginPath(); g.moveTo(48, 12); g.quadraticCurveTo(76, 18, 82, 24); g.quadraticCurveTo(82, 66, 48, 86); g.quadraticCurveTo(14, 66, 14, 24); g.quadraticCurveTo(20, 18, 48, 12);
    outline(g, '#c23b30');
    g.fillStyle = '#f2c230'; g.fillRect(43, 20, 10, 56); g.fillRect(24, 38, 48, 10);
  },
  armor(g) {
    g.beginPath(); g.moveTo(26, 22); g.lineTo(40, 18); g.quadraticCurveTo(48, 28, 56, 18); g.lineTo(70, 22); g.lineTo(80, 40); g.lineTo(70, 46); g.lineTo(68, 80); g.lineTo(28, 80); g.lineTo(26, 46); g.lineTo(16, 40); g.closePath();
    outline(g, '#b7c0ca');
    g.strokeStyle = '#7d8893'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(30, 58); g.lineTo(66, 58); g.moveTo(30, 68); g.lineTo(66, 68); g.moveTo(48, 30); g.lineTo(48, 78); g.stroke();
  },
  coin(g) {
    g.beginPath(); g.arc(48, 48, 34, 0, 7); outline(g, '#f2c230');
    g.beginPath(); g.arc(48, 48, 24, 0, 7); g.lineWidth = 4; g.strokeStyle = '#c8901a'; g.stroke();
    g.fillStyle = '#c8901a'; g.font = 'bold 32px Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 48, 50);
  },
  boot(g) {
    g.beginPath(); g.moveTo(30, 14); g.lineTo(56, 14); g.lineTo(56, 54); g.lineTo(80, 62); g.quadraticCurveTo(86, 80, 76, 82); g.lineTo(24, 82); g.lineTo(24, 64); g.closePath(); outline(g, '#8a5530');
    g.fillStyle = '#5c3519'; g.fillRect(24, 74, 54, 8);
  },
  basket(g) {
    rr(g, 18, 36, 60, 46, 8); outline(g, '#c18a4a');
    g.strokeStyle = '#7a4f24'; g.lineWidth = 3;
    for (let x = 30; x < 78; x += 12) { g.beginPath(); g.moveTo(x, 38); g.lineTo(x, 80); g.stroke(); }
    g.beginPath(); g.moveTo(26, 36); g.quadraticCurveTo(48, 6, 70, 36); g.lineWidth = 6; g.strokeStyle = '#2a1a10'; g.stroke();
  },
  axe(g) {
    g.save(); g.translate(48, 48); g.rotate(0.6);
    rr(g, -4, -40, 8, 80, 3); outline(g, '#8a5530', 4);
    g.beginPath(); g.moveTo(2, -36); g.quadraticCurveTo(34, -40, 30, -10); g.lineTo(2, -14); g.closePath(); outline(g, '#d5dde5', 4);
    g.restore();
  },
  bellows(g) {
    g.beginPath(); g.moveTo(16, 48); g.lineTo(60, 22); g.lineTo(60, 74); g.closePath(); outline(g, '#9a6233');
    rr(g, 58, 42, 26, 12, 3); outline(g, '#b8c2cc', 4);
    g.fillStyle = '#ff9b3a'; g.beginPath(); g.arc(30, 74, 8, 0, 7); g.fill();
    g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(30, 76, 4, 0, 7); g.fill();
  },
  banner(g) {
    rr(g, 20, 10, 6, 76, 2); outline(g, '#7a4a25', 4);
    g.beginPath(); g.moveTo(26, 16); g.lineTo(78, 16); g.lineTo(78, 64); g.lineTo(52, 54); g.lineTo(26, 64); g.closePath(); outline(g, '#3a5fb0');
    g.fillStyle = '#f2c230'; g.beginPath(); g.arc(52, 36, 9, 0, 7); g.fill();
  },
  beer(g) {
    rr(g, 22, 28, 42, 54, 6); outline(g, '#c18a4a');
    g.beginPath(); g.arc(68, 54, 12, -1.4, 1.4); g.lineWidth = 7; g.strokeStyle = '#2a1a10'; g.stroke();
    g.beginPath(); g.ellipse(43, 26, 24, 10, 0, 0, 7); outline(g, '#fff6df', 4);
  },
  copper(g) { rockIcon(g, '#8a6a55', '#e08a42', '#4fae8a'); },
  tin(g) { rockIcon(g, '#8f949c', '#eef3f8', null); },
  bronze(g) {
    g.beginPath(); g.moveTo(14, 66); g.lineTo(26, 38); g.lineTo(78, 38); g.lineTo(84, 66); g.closePath(); outline(g, '#c7843f');
    g.beginPath(); g.moveTo(26, 38); g.lineTo(34, 28); g.lineTo(84, 28); g.lineTo(78, 38); g.closePath(); outline(g, '#e6a865');
  },
  steel(g) {
    g.beginPath(); g.moveTo(14, 66); g.lineTo(26, 38); g.lineTo(78, 38); g.lineTo(84, 66); g.closePath(); outline(g, '#7d8a99');
    g.beginPath(); g.moveTo(26, 38); g.lineTo(34, 28); g.lineTo(84, 28); g.lineTo(78, 38); g.closePath(); outline(g, '#a9b6c4');
    g.strokeStyle = '#dbe4ee'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 56); g.lineTo(70, 46); g.stroke();
  },
  spear(g) {
    g.save(); g.translate(48, 48); g.rotate(-Math.PI / 4);
    rr(g, -4, -20, 8, 64, 3); outline(g, '#8a5530', 4);
    g.beginPath(); g.moveTo(0, -46); g.lineTo(10, -22); g.lineTo(-10, -22); g.closePath(); outline(g, '#e6a865', 4);
    g.restore();
  },
  helmet(g) {
    g.beginPath(); g.moveTo(16, 70); g.quadraticCurveTo(14, 22, 48, 20); g.quadraticCurveTo(82, 22, 80, 70); g.lineTo(62, 70); g.lineTo(62, 50); g.lineTo(34, 50); g.lineTo(34, 70); g.closePath();
    outline(g, '#c7843f');
    g.beginPath(); g.moveTo(30, 18); g.quadraticCurveTo(48, 0, 66, 18); g.lineTo(60, 22); g.quadraticCurveTo(48, 10, 36, 22); g.closePath(); outline(g, '#c23b30', 4);
  },
  goldleaf(g) {
    g.beginPath(); g.moveTo(48, 10); g.quadraticCurveTo(84, 40, 48, 86); g.quadraticCurveTo(12, 40, 48, 10); outline(g, '#f2c230');
    g.strokeStyle = '#c8901a'; g.lineWidth = 3; g.beginPath(); g.moveTo(48, 20); g.lineTo(48, 78); g.stroke();
  },
  crystal(g) {
    g.beginPath(); g.moveTo(48, 8); g.lineTo(72, 36); g.lineTo(60, 86); g.lineTo(36, 86); g.lineTo(24, 36); g.closePath(); outline(g, '#8a6ae8');
    g.fillStyle = '#c9b8ff'; g.beginPath(); g.moveTo(48, 14); g.lineTo(60, 36); g.lineTo(48, 70); g.closePath(); g.fill();
  },
  fire(g) {
    g.beginPath(); g.moveTo(48, 8); g.quadraticCurveTo(86, 46, 72, 74); g.quadraticCurveTo(60, 92, 48, 88); g.quadraticCurveTo(22, 88, 22, 64); g.quadraticCurveTo(22, 40, 48, 8); outline(g, '#e8502a');
    g.beginPath(); g.moveTo(48, 38); g.quadraticCurveTo(66, 60, 58, 76); g.quadraticCurveTo(48, 84, 38, 76); g.quadraticCurveTo(32, 62, 48, 38); g.fillStyle = '#ffd36a'; g.fill();
  },
  seal(g) {
    g.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 2 ? 34 : 40; g.lineTo(48 + Math.cos(a) * r, 48 + Math.sin(a) * r); } g.closePath(); outline(g, '#b8322a');
    g.beginPath(); g.arc(48, 48, 22, 0, 7); g.lineWidth = 4; g.strokeStyle = '#7a1f18'; g.stroke();
    g.fillStyle = '#f6e7c4'; g.beginPath(); g.moveTo(34, 56); g.lineTo(36, 38); g.lineTo(42, 46); g.lineTo(48, 34); g.lineTo(54, 46); g.lineTo(60, 38); g.lineTo(62, 56); g.closePath(); g.fill();
  },
  map(g) {
    g.beginPath(); g.moveTo(12, 22); g.lineTo(34, 14); g.lineTo(62, 22); g.lineTo(84, 14); g.lineTo(84, 74); g.lineTo(62, 82); g.lineTo(34, 74); g.lineTo(12, 82); g.closePath(); outline(g, '#f6e7c4');
    g.strokeStyle = '#c23b30'; g.lineWidth = 4; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(24, 66); g.quadraticCurveTo(46, 30, 70, 40); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#c23b30'; g.font = 'bold 26px Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText('×', 72, 46);
  },
  chest(g) {
    rr(g, 14, 40, 68, 42, 6); outline(g, '#8a4626');
    g.beginPath(); g.moveTo(14, 42); g.quadraticCurveTo(48, 6, 82, 42); g.closePath(); outline(g, '#a0552e');
    g.fillStyle = '#f2c230'; g.fillRect(28, 26, 8, 56); g.fillRect(60, 26, 8, 56); rr(g, 40, 44, 16, 14, 3); g.fill();
  },
  star(g) {
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 18 : 40; g.lineTo(48 + Math.cos(a) * r, 52 + Math.sin(a) * r); } g.closePath(); outline(g, '#f2c230');
  },
  castle(g) {
    g.beginPath(); g.moveTo(14, 84); g.lineTo(14, 30); g.lineTo(24, 30); g.lineTo(24, 38); g.lineTo(34, 38); g.lineTo(34, 30); g.lineTo(44, 30); g.lineTo(44, 18); g.lineTo(52, 18); g.lineTo(52, 30); g.lineTo(62, 30); g.lineTo(62, 38); g.lineTo(72, 38); g.lineTo(72, 30); g.lineTo(82, 30); g.lineTo(82, 84); g.closePath(); outline(g, '#b7aa98');
    rr(g, 38, 56, 20, 28, 9); outline(g, '#5a3519', 4);
    g.fillStyle = '#c23b30'; g.beginPath(); g.moveTo(52, 6); g.lineTo(66, 11); g.lineTo(52, 16); g.fill();
  },
  steelsword(g) {
    g.save(); g.translate(48, 48); g.rotate(-Math.PI / 4);
    g.beginPath(); g.moveTo(-7, -8); g.lineTo(-7, -44); g.lineTo(0, -52); g.lineTo(7, -44); g.lineTo(7, -8); g.closePath(); outline(g, '#a9c4e0', 4);
    rr(g, -22, -10, 44, 9, 3); outline(g, '#2f4f9a', 4);
    rr(g, -4, -1, 8, 24, 2); outline(g, '#1e1e22', 4);
    g.restore();
  },
  sand(g) {
    g.beginPath(); g.moveTo(10, 76); g.quadraticCurveTo(48, 10, 86, 76); g.closePath(); outline(g, '#e2c27a');
    g.fillStyle = '#f2c230'; [[40, 56, 4], [56, 48, 3], [50, 66, 3]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  },
  nugget(g) {
    g.beginPath(); g.moveTo(18, 60); g.lineTo(30, 32); g.lineTo(56, 24); g.lineTo(78, 40); g.lineTo(76, 64); g.lineTo(48, 76); g.closePath(); outline(g, '#f2c230');
    g.fillStyle = '#fff2a8'; g.beginPath(); g.moveTo(34, 38); g.lineTo(54, 32); g.lineTo(44, 48); g.fill();
  },
  crown(g) {
    g.beginPath(); g.moveTo(14, 74); g.lineTo(14, 30); g.lineTo(32, 50); g.lineTo(48, 22); g.lineTo(64, 50); g.lineTo(82, 30); g.lineTo(82, 74); g.closePath(); outline(g, '#f2c230');
    g.fillStyle = '#c23b30'; g.beginPath(); g.arc(48, 60, 7, 0, 7); g.fill();
    g.fillStyle = '#3a5fb0'; g.beginPath(); g.arc(28, 62, 5, 0, 7); g.arc(68, 62, 5, 0, 7); g.fill();
  },
  crystalore(g) { rockIcon(g, '#4a4458', '#b59aff', null); },
  mana(g) {
    g.beginPath(); g.arc(48, 58, 28, 0, 7); outline(g, '#4fc3ff');
    rr(g, 40, 14, 16, 18, 3); outline(g, '#dfe6ee', 4);
    g.fillStyle = '#c7f0ff'; g.beginPath(); g.arc(38, 50, 7, 0, 7); g.fill();
  },
  staff(g) {
    g.save(); g.translate(48, 48); g.rotate(-Math.PI / 4);
    rr(g, -4, -24, 8, 70, 3); outline(g, '#5a3519', 4);
    g.beginPath(); g.moveTo(0, -48); g.lineTo(12, -32); g.lineTo(0, -18); g.lineTo(-12, -32); g.closePath(); outline(g, '#b59aff', 4);
    g.restore();
  },
  lava(g) { rockIcon(g, '#2a2220', '#ff6a1a', '#ffd36a'); },
  scale(g) {
    g.beginPath(); g.moveTo(48, 12); g.lineTo(80, 34); g.lineTo(72, 74); g.lineTo(48, 86); g.lineTo(24, 74); g.lineTo(16, 34); g.closePath(); outline(g, '#2f7a5a');
    g.strokeStyle = '#7fd0a8'; g.lineWidth = 4; g.beginPath(); g.moveTo(48, 22); g.lineTo(48, 74); g.stroke();
  },
  dragonshield(g) {
    g.beginPath(); g.moveTo(48, 12); g.quadraticCurveTo(76, 18, 82, 24); g.quadraticCurveTo(82, 66, 48, 86); g.quadraticCurveTo(14, 66, 14, 24); g.quadraticCurveTo(20, 18, 48, 12);
    outline(g, '#2f7a5a');
    g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(48, 26); g.quadraticCurveTo(66, 46, 58, 62); g.quadraticCurveTo(48, 72, 38, 62); g.quadraticCurveTo(30, 46, 48, 26); g.fill();
  },
  dragon(g) {
    g.beginPath(); g.moveTo(12, 70); g.quadraticCurveTo(30, 40, 48, 48); g.lineTo(60, 22); g.lineTo(66, 40); g.lineTo(84, 34); g.lineTo(74, 52); g.quadraticCurveTo(66, 74, 40, 76); g.closePath(); outline(g, '#2f7a5a');
    g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(70, 44, 3, 0, 7); g.fill();
  },
  gem(g) {
    g.beginPath(); g.moveTo(28, 22); g.lineTo(68, 22); g.lineTo(84, 40); g.lineTo(48, 82); g.lineTo(12, 40); g.closePath(); outline(g, '#3fc8e8');
    g.fillStyle = '#b8f0ff'; g.beginPath(); g.moveTo(28, 22); g.lineTo(40, 40); g.lineTo(12, 40); g.closePath(); g.fill();
    g.fillStyle = '#1f8fb8'; g.beginPath(); g.moveTo(56, 40); g.lineTo(84, 40); g.lineTo(48, 82); g.closePath(); g.fill();
    g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(12, 40); g.lineTo(84, 40); g.moveTo(40, 40); g.lineTo(48, 82); g.lineTo(56, 40); g.stroke();
  },
  bolt(g) {
    g.beginPath(); g.moveTo(56, 8); g.lineTo(22, 54); g.lineTo(44, 54); g.lineTo(36, 88); g.lineTo(76, 38); g.lineTo(52, 38); g.closePath(); outline(g, '#ffd84a');
  },
  tv(g) {
    rr(g, 10, 24, 76, 54, 8); outline(g, '#4a2e1c');
    rr(g, 18, 32, 60, 38, 4); outline(g, '#5ab4e0', 3);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(42, 40); g.lineTo(58, 51); g.lineTo(42, 62); g.closePath(); g.fill();
    g.strokeStyle = '#2a1a10'; g.lineWidth = 5; g.beginPath(); g.moveTo(36, 10); g.lineTo(48, 24); g.lineTo(60, 10); g.stroke();
  },
  home(g) {
    g.beginPath(); g.moveTo(48, 12); g.lineTo(86, 46); g.lineTo(74, 46); g.lineTo(74, 84); g.lineTo(22, 84); g.lineTo(22, 46); g.lineTo(10, 46); g.closePath(); outline(g, '#f6e7c4');
    rr(g, 40, 58, 16, 26, 3); outline(g, '#8a5530', 4);
  },
  store(g) {
    rr(g, 14, 40, 68, 42, 6); outline(g, '#f6e7c4');
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(10 + i * 19, 40); g.lineTo(14 + i * 19, 18); g.lineTo(33 + i * 19, 18); g.lineTo(29 + i * 19, 40); g.closePath(); outline(g, i % 2 ? '#f6e7c4' : '#c23b30', 4); }
    rr(g, 38, 56, 20, 26, 3); outline(g, '#8a5530', 4);
  },
  golem(g) {
    rr(g, 26, 30, 44, 44, 6); outline(g, '#8a8f96');
    rr(g, 34, 10, 28, 24, 5); outline(g, '#9aa4ae');
    g.fillStyle = '#ff8a2a'; g.fillRect(39, 18, 6, 6); g.fillRect(51, 18, 6, 6);
    rr(g, 10, 34, 16, 34, 5); outline(g, '#7d8893', 4); rr(g, 70, 34, 16, 34, 5); outline(g, '#7d8893', 4);
    rr(g, 30, 74, 14, 16, 3); outline(g, '#6d7680', 4); rr(g, 52, 74, 14, 16, 3); outline(g, '#6d7680', 4);
    g.fillStyle = '#d2753a'; g.beginPath(); g.arc(48, 52, 6, 0, 7); g.fill();
  },
  serpent(g) {
    g.lineCap = 'round'; g.lineWidth = 18; g.strokeStyle = '#2a1a10';
    g.beginPath(); g.moveTo(14, 80); g.quadraticCurveTo(40, 50, 26, 40); g.quadraticCurveTo(14, 26, 44, 22); g.stroke();
    g.lineWidth = 11; g.strokeStyle = '#d9813a'; g.stroke();
    g.beginPath(); g.ellipse(60, 24, 18, 12, 0.2, 0, 7); outline(g, '#c7843f');
    g.fillStyle = '#4fae8a'; g.beginPath(); g.arc(64, 20, 4, 0, 7); g.fill();
    g.strokeStyle = '#c23b30'; g.lineWidth = 3; g.beginPath(); g.moveTo(76, 28); g.lineTo(86, 32); g.lineTo(84, 26); g.stroke();
  },
  giant(g) {
    g.beginPath(); g.moveTo(20, 86); g.lineTo(24, 40); g.quadraticCurveTo(48, 26, 72, 40); g.lineTo(76, 86); g.closePath(); outline(g, '#3c3a3a');
    g.beginPath(); g.arc(48, 26, 16, 0, 7); outline(g, '#4a4646');
    g.fillStyle = '#ff6a1a'; g.fillRect(40, 22, 5, 5); g.fillRect(52, 22, 5, 5);
    g.strokeStyle = '#ff8a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(34, 50); g.lineTo(44, 62); g.lineTo(38, 74); g.moveTo(60, 48); g.lineTo(54, 62); g.stroke();
  },
  croc(g) {
    g.beginPath(); g.moveTo(8, 56); g.quadraticCurveTo(30, 36, 60, 42); g.lineTo(88, 46); g.lineTo(88, 58); g.lineTo(60, 62); g.quadraticCurveTo(30, 72, 8, 56); outline(g, '#c9a030');
    g.fillStyle = '#fff'; for (let x = 62; x < 86; x += 6) { g.beginPath(); g.moveTo(x, 52); g.lineTo(x + 3, 46); g.lineTo(x + 6, 52); g.fill(); }
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(56, 44, 3, 0, 7); g.fill();
    g.fillStyle = '#f2c230'; for (let x = 20; x < 52; x += 10) { g.beginPath(); g.arc(x, 50, 3, 0, 7); g.fill(); }
  },
  spider(g) {
    g.strokeStyle = '#2a1a10'; g.lineWidth = 5; g.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(48, 52); g.lineTo(48 + s * 24, 34 + i * 12); g.lineTo(48 + s * 40, 44 + i * 14); g.stroke(); }
    g.beginPath(); g.ellipse(48, 58, 16, 20, 0, 0, 7); outline(g, '#6a3ae0');
    g.beginPath(); g.arc(48, 34, 11, 0, 7); outline(g, '#8a6ae8');
    g.fillStyle = '#ff4a6a'; g.beginPath(); g.arc(44, 32, 3, 0, 7); g.arc(52, 32, 3, 0, 7); g.fill();
    g.fillStyle = '#c9b8ff'; g.beginPath(); g.moveTo(48, 50); g.lineTo(54, 60); g.lineTo(48, 70); g.lineTo(42, 60); g.closePath(); g.fill();
  },
  magma(g) {
    g.beginPath(); g.moveTo(16, 88); g.lineTo(22, 40); g.lineTo(34, 24); g.lineTo(62, 24); g.lineTo(74, 40); g.lineTo(80, 88); g.closePath(); outline(g, '#2a2220');
    g.strokeStyle = '#ff6a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 50); g.lineTo(42, 62); g.lineTo(36, 80); g.moveTo(64, 46); g.lineTo(54, 64); g.lineTo(62, 82); g.stroke();
    g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(40, 36, 5, 0, 7); g.arc(56, 36, 5, 0, 7); g.fill();
    g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(34, 24); g.lineTo(40, 6); g.lineTo(48, 22); g.lineTo(56, 4); g.lineTo(62, 24); g.closePath(); g.fill();
  },
  bow(g) {
    g.lineWidth = 7; g.strokeStyle = '#2a1a10'; g.beginPath(); g.arc(30, 48, 36, -1.1, 1.1); g.stroke();
    g.lineWidth = 4; g.strokeStyle = '#8a5530'; g.stroke();
    g.strokeStyle = '#e9e2d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(46, 16); g.lineTo(46, 80); g.stroke();
    g.strokeStyle = '#2a1a10'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 48); g.lineTo(86, 48); g.stroke();
    g.fillStyle = '#9aa4ae'; g.beginPath(); g.moveTo(90, 48); g.lineTo(78, 41); g.lineTo(78, 55); g.closePath(); g.fill();
  },
  army(g) {
    for (const s of [-1, 1]) {
      g.save(); g.translate(48, 50); g.rotate(s * Math.PI / 4);
      g.beginPath(); g.moveTo(-5, -10); g.lineTo(-5, -40); g.lineTo(0, -46); g.lineTo(5, -40); g.lineTo(5, -10); g.closePath(); outline(g, '#dfe6ee', 4);
      rr(g, -15, -12, 30, 7, 3); outline(g, '#f2c230', 4);
      rr(g, -3, -5, 6, 20, 2); outline(g, '#7a4a25', 4);
      g.restore();
    }
  },
  hammer(g) {
    g.save(); g.translate(48, 48); g.rotate(-0.6);
    rr(g, -4, -10, 8, 50, 3); outline(g, '#8a5530', 4);
    rr(g, -22, -30, 44, 22, 4); outline(g, '#9aa4ae', 4);
    g.restore();
  },
};

DRAW.dragonfire = DRAW.fire;

export function icon(name) {
  if (cache[name]) return cache[name];
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.lineJoin = 'round';
  (DRAW[name] || DRAW.coin)(g);
  cache[name] = c.toDataURL();
  return cache[name];
}

export function iconImg(name, cls = 'ico') {
  return `<img class="${cls}" src="${icon(name)}" alt="" draggable="false">`;
}

export { DRAW as ICON_DRAW };
