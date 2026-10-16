// Bölgelerden bağımsız ekonomi değerleri. Bölgeye özel tarif, sipariş ve yerleşim src/regions/ altında.
import { L } from './i18n.js';

// Eşyalar: satış fiyatı ve sırtta/rafta kapladığı yükseklik
export const ITEMS = {
  wood:   { name: 'Odun',         price: 2,  h: 0.30 },
  ore:    { name: 'Demir Filizi', price: 3,  h: 0.34 },
  coal:   { name: 'Kömür',        price: 4,  h: 0.30 },
  ingot:  { name: 'Demir Külçe',  price: 10, h: 0.20 },
  sword:  { name: 'Kılıç',        price: 25, h: 0.12 },
  shield: { name: 'Kalkan',       price: 34, h: 0.12 },
  armor:  { name: 'Zırh Seti',    price: 95, h: 0.34 },
  copper: { name: 'Bakır',        price: 3,  h: 0.34 },
  tin:    { name: 'Kalay',        price: 3,  h: 0.34 },
  bronze: { name: 'Bronz',        price: 14, h: 0.20 },
  spear:  { name: 'Mızrak',       price: 30, h: 0.10 },
  helmet: { name: 'Miğfer',       price: 48, h: 0.30 },
  steel:      { name: 'Çelik',          price: 26,  h: 0.20 },
  steelsword: { name: 'Çelik Kılıç',    price: 60,  h: 0.12 },
  sand:       { name: 'Nehir Kumu',     price: 1,   h: 0.22 },
  nugget:     { name: 'Altın Külçe',    price: 22,  h: 0.16 },
  goldleaf:   { name: 'Altın Varak',    price: 40,  h: 0.08 },
  crown:      { name: 'Taç',            price: 140, h: 0.26 },
  crystalore: { name: 'Kristal Damarı', price: 6,   h: 0.32 },
  crystal:    { name: 'Ruh Kristali',   price: 45,  h: 0.30 },
  mana:       { name: 'Mana Suyu',      price: 8,   h: 0.30 },
  staff:      { name: 'Büyü Asası',     price: 120, h: 0.10 },
  lava:       { name: 'Lav Taşı',       price: 6,   h: 0.30 },
  scale:      { name: 'Ejderha Pulu',   price: 24,  h: 0.08 },
  dragonfire: { name: 'Ejderha Ateşi',  price: 160, h: 0.32 },
  dragonshield: { name: 'Ejderha Kalkanı', price: 180, h: 0.12 },
};

export const STATION_INPUT_CAP = 16;
export const STATION_OUTPUT_CAP = 16;
export const SHELF_CAP = 24;
export const QUEUE_MAX = 4;

// Her bölgede ortak geliştirmeler (bölge başına ayrı seviye tutulur).
// İşçiler bölge verisinden eklenir. cost = base * growth^seviye
// Değerler, bir haftalık hedefin ~12-13 saat oyun sürmesi için bot simülasyonuyla ayarlandı (scripts/README).
export const BASE_UPGRADES = [
  { id: 'speed',    icon: 'boot',    name: 'Deri Çizme',   base: 40,  growth: 1.6,  max: 12, info: (l) => `${L('Hız', 'Speed')} ${stats.speed(l).toFixed(1)}` },
  { id: 'capacity', icon: 'basket',  name: 'Sırt Küfesi',  base: 50,  growth: 1.55, max: 15, info: (l) => `${L('Taşıma', 'Carry')} ${stats.capacity(l)}` },
  { id: 'gather',   icon: 'axe',     name: 'Keskin Balta', base: 60,  growth: 1.6,  max: 15, info: (l) => `${L('Toplama', 'Gather')} ${(1 / stats.gather(l)).toFixed(1)}/${L('sn', 's')}` },
  { id: 'craft',    icon: 'bellows', name: 'Körük',        base: 120, growth: 1.55, max: 20, info: (l) => `${L('Atölye', 'Workshop')} x${(1 / stats.craft(l)).toFixed(2)}` },
  { id: 'fame',     icon: 'banner',  name: 'Ün',           base: 150, growth: 1.6,  max: 20, info: (l) => L(`Fiyat +%${Math.round((stats.price(l) - 1) * 100)}`, `Price +${Math.round((stats.price(l) - 1) * 100)}%`) },
  { id: 'training', icon: 'beer',    name: 'İşçi Eğitimi', base: 300, growth: 1.7,  max: 15, crew: true, info: (l) => L(`İşçi taşıma ${stats.workerCap(l)}, hız ${stats.workerSpeed(l).toFixed(1)}`, `Worker carry ${stats.workerCap(l)}, speed ${stats.workerSpeed(l).toFixed(1)}`) },
];
export const WORKER_GROWTH = 2.2;
export const WORKER_MAX = 4;

export const upgradeCost = (u, lvl) => Math.round(u.base * Math.pow(u.growth, lvl));

// Seviyeden değere dönüşümler
export const stats = {
  speed: (l) => 4.4 + 0.3 * l,
  capacity: (l) => 6 + 2 * l,
  gather: (l) => 0.5 * Math.pow(0.9, l),           // saniye / eşya
  craft: (l) => Math.pow(0.9, l),                   // süre çarpanı
  price: (l) => 1 + 0.08 * l,
  spawn: (l) => 5.0 * Math.pow(0.93, l),            // müşteri gelme aralığı
  workerSpeed: (l) => 3.0 + 0.2 * l,
  workerCap: (l) => 3 + l,
  workerGather: (l) => 0.9 * Math.pow(0.92, l),
};

// Krallık Mührü ile alınan kalıcı bonuslar (bütün bölgelerde geçerli)
export const META = [
  { id: 'startGold',  icon: 'coin',    name: 'Hazine Sandığı',   max: 10, cost: (l) => 2 + l * 2, info: (l) => L(`Yeni bölgeye ${l * 150} altınla başla`, `Start new regions with ${l * 150} gold`) },
  { id: 'freeWorker', icon: 'beer',    name: 'Sadık Cüce',       max: 1,  cost: () => 6,          info: (l) => (l ? L('Her bölgede ilk işçi bedava', 'First worker free in every region') : L('Her bölgede ilk işçi bedava olur', 'Makes the first worker free in every region')) },
  { id: 'boots',      icon: 'boot',    name: 'Kraliyet Çizmesi', max: 5,  cost: (l) => 3 + l * 3, info: (l) => L(`Oyuncu hızı +%${l * 8}`, `Player speed +${l * 8}%`) },
  { id: 'merchant',   icon: 'banner',  name: 'Lonca Ferman',     max: 10, cost: (l) => 4 + l * 3, info: (l) => L(`Bütün satışlar +%${l * 5}`, `All sales +${l * 5}%`) },
  { id: 'craftsman',  icon: 'bellows', name: 'Usta Çıraklık',    max: 10, cost: (l) => 4 + l * 3, info: (l) => L(`Bütün atölyeler +%${l * 5} hızlı`, `All workshops +${l * 5}% faster`) },
  { id: 'passive',    icon: 'map',     name: 'Kervan Yolu',      max: 5,  cost: (l) => 5 + l * 4, info: (l) => L(`Ambara akış +%${l * 30}`, `Storehouse flow +${l * 30}%`) },
];

// Bölgeden Krallık Ambarı'na dakikadaki pasif kervan akışı (bölgede en az bir sipariş bitmiş olmalı)
export const exportRate = (workers, passiveLvl) => (0.2 + 0.08 * workers) * (1 + 0.3 * passiveLvl);
export const OFFLINE_CAP_H = 8;
export const OFFLINE_EFFICIENCY = 0.5;

// Sipariş ödülü (mühür) ve bölge açılışı
export const orderSeals = (level) => 1 + Math.floor(level / 2);
export const REGION_UNLOCK_LEVEL = 3;

// Kervan durağına başka bölgelerden gelen mal (Ambar'dan, sn başına)
export const DEPOT_INTERVAL = 5;
export const DEPOT_CAP = 12;

// Ganimet: yenilen her düşman bütün satışları kalıcı olarak artırır
export const TROPHY_BONUS = 0.03;

// Ordu ve bölge bekçisi: asker türleri seviye atlar (her seviye fiyatı %12 artırır, vuruşu bir kat ekler);
// bekçiye günde en fazla 3 saldırı, her saldırı FIGHT_TIME saniye sürer
export const ARMY_GROWTH = 1.12;
export const ARMY_MAX = 40;
export const GUARDIAN_TRIES = 3;
export const guardianSeals = (regionIdx) => 3 + regionIdx * 2;

export const FIGHT_TIME = 30;
