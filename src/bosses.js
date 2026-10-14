// Haftalık seferler: her 7 günde krallığa yeni bir düşman gelir. Düşmanı yenmek için Kraliyet Örsü'nde
// o haftanın silahı, Krallık Ambarı'ndaki malzemelerle parça parça dövülür. Oyun hiç bitmez:
// liste döndükçe düşmanlar güçlenir. needs değerleri 1. hafta (Kızıl Ejderha) ölçeğindedir.

export const WEEK_MS = 7 * 24 * 3600 * 1000;

export const BOSSES = [
  {
    id: 'dragon', name: 'Kızıl Ejderha', icon: 'dragon', color: '#c23b30', weapon: 'Ejderha Kıran Kılıcı', weaponIcon: 'steelsword',
    story: 'Kızıl Ejderha uyandı ve köyleri yakıyor. Ona ancak ejderha ateşiyle dövülmüş bir kılıç işler.',
    parts: [
      { name: 'Çekirdek', needs: { ingot: 1700 } },
      { name: 'Koruma', needs: { bronze: 1250 } },
      { name: 'Namlu', needs: { steel: 1000, dragonfire: 320 } },
      { name: 'Kabza', needs: { goldleaf: 700 } },
      { name: 'Mücevher', needs: { crystal: 850 } },
    ],
  },
  {
    id: 'frost', name: 'Buz Devi', icon: 'crystal', color: '#4fa3e8', weapon: 'Alev Baltası', weaponIcon: 'axe',
    story: 'Kuzeyden inen Buz Devi nehirleri donduruyor. Buzu yalnızca ateşle dövülmüş bir balta kırar.',
    parts: [
      { name: 'Balta Başı', needs: { steel: 380, dragonfire: 40 } },
      { name: 'Sap', needs: { bronze: 420 } },
      { name: 'Kor Taşı', needs: { crystal: 110 } },
      { name: 'Kayış', needs: { ingot: 420 } },
    ],
  },
  {
    id: 'kraken', name: 'Derinlerin Krakeni', icon: 'mana', color: '#2f7a8a', weapon: 'Kraliyet Zıpkın Filosu', weaponIcon: 'spear',
    story: 'Kraken nehir ağzını tuttu, kervanlar geçemiyor. Krallığın zıpkınlı gemilere ihtiyacı var.',
    parts: [
      { name: 'Zıpkınlar', needs: { bronze: 520, ingot: 300 } },
      { name: 'Gemi Zırhı', needs: { steel: 320 } },
      { name: 'Pusula', needs: { goldleaf: 180 } },
      { name: 'Fener Taşı', needs: { crystal: 90 } },
    ],
  },
  {
    id: 'lich', name: 'Kara Lich', icon: 'staff', color: '#6b3fa0', weapon: 'Kutsal Asa', weaponIcon: 'staff',
    story: 'Mezarlıklardan kalkan Kara Lich ölüler ordusu topluyor. Kutsal bir asa onun büyüsünü bozar.',
    parts: [
      { name: 'Asa', needs: { goldleaf: 260 } },
      { name: 'Kristal Taç', needs: { crystal: 170 } },
      { name: 'Muhafız Zırhı', needs: { steel: 300 } },
      { name: 'Mühür', needs: { bronze: 300, ingot: 250 } },
    ],
  },
  {
    id: 'golem', name: 'Taş Golem', icon: 'ore', color: '#8d877e', weapon: 'Dev Savaş Çekici', weaponIcon: 'hammer',
    story: 'Dağlardan kopan Taş Golem kale surlarını yıkıyor. Onu ancak dev bir çekiç parçalar.',
    parts: [
      { name: 'Çekiç Başı', needs: { steel: 450, ingot: 400 } },
      { name: 'Sap', needs: { bronze: 380 } },
      { name: 'Rün', needs: { crystal: 120, goldleaf: 80 } },
    ],
  },
  {
    id: 'warlord', name: 'Ork Savaş Lordu', icon: 'shield', color: '#4f8f45', weapon: 'Kraliyet Ordusu', weaponIcon: 'shield',
    story: 'Ork Savaş Lordu sınırda ordusunu topladı. Krallığın kendi ordusunu silahlandırması gerek.',
    parts: [
      { name: 'Kılıçlar', needs: { ingot: 650 } },
      { name: 'Kalkanlar', needs: { bronze: 480 } },
      { name: 'Zırhlar', needs: { steel: 380 } },
      { name: 'Sancak', needs: { goldleaf: 140 } },
    ],
  },
  {
    id: 'shadow', name: 'Gölge Kraliçe', icon: 'crystal', color: '#3a3646', weapon: 'Işık Kalkanı', weaponIcon: 'dragonshield',
    story: 'Gölge Kraliçe güneşi örttü, ekinler soluyor. Işığı geri getirecek kalkan dövülmeli.',
    parts: [
      { name: 'Kalkan Gövdesi', needs: { steel: 360 } },
      { name: 'Işık Kristali', needs: { crystal: 160 } },
      { name: 'Altın Kenar', needs: { goldleaf: 200 } },
      { name: 'Kutsal Alev', needs: { dragonfire: 45 } },
    ],
  },
  {
    id: 'wolf', name: 'Kurt Kral', icon: 'sword', color: '#5a5a66', weapon: 'Gümüş Oklar', weaponIcon: 'spear',
    story: 'Kurt Kral ve sürüsü ormanları sardı. Kurtları yalnızca gümüş uçlu oklar durdurur.',
    parts: [
      { name: 'Ok Uçları', needs: { steel: 400, goldleaf: 120 } },
      { name: 'Yaylar', needs: { bronze: 400 } },
      { name: 'Sadaklar', needs: { ingot: 450 } },
      { name: 'Av Borusu', needs: { crystal: 90 } },
    ],
  },
];

// Haftanın düşmanı ve ölçeklenmiş ihtiyaçları. İlk hafta krallık kurulurken geçer (Kızıl Ejderha kendi
// ölçeğinde). Sonraki haftalarda bütün bölgeler açık ve gelişmiş olduğundan ~11 kat ister. Bot
// simülasyonunda 6,5 kat 6,6 saat sürdü (olgun bölge saatte ~1100-1250 mal), 11 kat ~11-12 saat eder.
// Her hafta %10 artar.
export function weekBoss(week) {
  const boss = BOSSES[week % BOSSES.length];
  const k = week === 0 ? 1 : boss.id === 'dragon' ? 4.4 * Math.pow(1.1, week - 1) : 11 * Math.pow(1.1, week - 1);
  return {
    ...boss,
    week,
    parts: boss.parts.map((p, i) => ({
      id: i,
      name: p.name,
      needs: Object.fromEntries(Object.entries(p.needs).map(([t, n]) => [t, Math.ceil(n * k)])),
    })),
  };
}

// Düşman yenildikten sonra haftanın kalanı için sonsuz Kraliyet Görevleri
const BOUNTY_MATS = ['ingot', 'bronze', 'steel', 'goldleaf', 'crystal', 'dragonfire'];
const BOUNTY_BASE = { ingot: 120, bronze: 100, steel: 80, goldleaf: 50, crystal: 30, dragonfire: 8 };
export function bounty(n) {
  const t = BOUNTY_MATS[(n * 7 + 3) % BOUNTY_MATS.length];
  return { type: t, amount: Math.ceil(BOUNTY_BASE[t] * Math.pow(1.12, n)), seals: 2 + Math.floor(n / 3) };
}

// Zafer ödülü
export const victorySeals = (week) => 10 + 3 * week;
