// Güç puanı: oyuncunun krallığının toplam gücü. Kayıttan her an yeniden hesaplanır.
// Sıralamada "Genel" bu puandır; haftalık/aylık/yıllık sıralama o dönemde kazanılan güç artışını sayar.
//
// Bölge ağırlığı w = bölge sırası (Köy 1 ... Ejderha Dağı 6). Sonraki bölgeler daha çok puan verir.
//   Siparişler:   her sipariş seviyesi L için 50·w·L       (1+2+...+L, sonsuz)
//   Bekçi:        yenilen bekçi başına 2000·w
//   Hız bonusu:   bekçiyi hedef sürede yenene 1500·w; daha yavaşa oranla daha az
//   Ordu:         her asker seviyesi için 15·w
//   Haftalık:     yenilen her haftalık düşman 5000 + 1000·hafta
//   Görevler:     her Kraliyet Görevi 300 (toplam sayaç; hafta değişince sıfırlanmaz)
import { REGIONS } from './regions/index.js';

// Hedef süreler (dk): bot simülasyonunda 3. sipariş + bekçi süresinin 1,5 katı
const PAR_MIN = { village: 216, valley: 243, castle: 275, river: 189, caves: 500, dragon: 185 };

export function powerParts(profile) {
  const d = profile.data;
  const p = { orders: 0, guardians: 0, speed: 0, army: 0, weekly: 0 };
  REGIONS.forEach((def, i) => {
    const r = d.regions[def.id];
    if (!r) return;
    const w = i + 1;
    const L = r.level || 0;
    p.orders += 50 * w * (L * (L + 1)) / 2;
    if (r.guardianDefeated) {
      p.guardians += 2000 * w;
      if (r.clearSec > 0) p.speed += Math.round(1500 * w * Math.min(1, (PAR_MIN[def.id] * 60) / r.clearSec));
    }
    p.army += 15 * w * Object.values(r.army || {}).reduce((s, n) => s + n, 0);
  });
  const c = d.campaign;
  if (c) {
    for (const h of c.history || []) if (h.won) p.weekly += 5000 + 1000 * h.week;
    if (c.won) p.weekly += 5000 + 1000 * c.week;
  }
  p.weekly += 300 * (d.bountiesDone || 0);
  return p;
}

export function computePower(profile) {
  const p = powerParts(profile);
  return Math.round(p.orders + p.guardians + p.speed + p.army + p.weekly);
}
