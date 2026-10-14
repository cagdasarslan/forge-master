// Bölge 1: Demirci Köyü. Odun + demir → külçe, kılıç, kalkan. Başkente Demir Külçe gönderir.
export default {
  id: 'village',
  name: 'Demirci Köyü',
  icon: 'hammer',
  map: { x: 20, y: 82 },
  intro: 'Ormandan odun, madenden demir topla. Kral için kılıç dök.',
  exports: 'ingot',
  startGold: 0,
  theme: { grass: [0x76b84a, 0x6aab42, 0x84c255], dirt: 0xc9a06a, dirtDark: 0xb08654, sky: 0x9fd3e8, floor: 'dirt', backdrop: 'village' },

  layout: {
    bounds: { minX: -15, maxX: 15, minZ: -21, maxZ: 17 },
    spawn: [0, 1.5],
    roadZ: 19,
    tavern: [-12.9, 4, Math.PI / 2],
    tavernDoor: [-12.5, 6.2],
    dirt: [[26, 22, 0, 1.5], [9, 7, 9, -13.5, 1], [3, 6, 0, -10]],
  },

  nodes: [
    { id: 'forest', type: 'wood', label: 'ORMAN', zone: [-9, -12], r: 2.3, visual: 'trees' },
    { id: 'mine', type: 'ore', label: 'MADEN', zone: [9, -12], r: 2.3, visual: 'rocks', rock: 0x7f7a74, speck: 0xd2753a, entrance: [9, -17] },
  ],

  stations: [
    { id: 'smelter', model: 'smelter', label: 'DÖKÜMHANE', pos: [0, -6.5], zone: [0, -4.1], r: 1.5,
      recipe: { in: { wood: 1, ore: 1 }, out: 'ingot', time: 3 } },
    { id: 'anvil', model: 'anvil', label: 'ÖRS', pos: [7, -0.2], zone: [7, 2.0], r: 1.4, requires: 'anvil',
      recipe: { in: { ingot: 1, wood: 1 }, out: 'sword', time: 4 } },
    { id: 'bench', model: 'bench', label: 'KALKAN', pos: [-7, -0.2], zone: [-7, 2.0], r: 1.4, requires: 'bench',
      recipe: { in: { ingot: 1, wood: 2 }, out: 'shield', time: 5 } },
  ],

  counters: [
    { id: 'market', label: 'TÜCCAR', icon: 'ingot', pos: [-7, 11], zone: [-7, 9.4], coins: [-10.2, 10.4], canopy: 'green',
      customers: [{ look: 'merchant', wants: 'ingot', need: [1, 4] }] },
    { id: 'weapons', label: 'SİLAH', icon: 'sword', pos: [7, 11], zone: [7, 9.4], coins: [10.2, 10.4], canopy: 'red', requires: 'anvil',
      customers: [{ look: 'knight', wants: 'sword', need: [1, 2] }, { look: 'soldier', wants: 'shield', need: [1, 2] }] },
  ],

  chest: { pos: [0, 10.6], zone: [0, 8.9], r: 1.25 },

  unlocks: [
    { id: 'anvil', name: 'Örs & Silah Tezgahı', cost: 400, pos: [7, -0.2] },
    { id: 'bench', name: 'Kalkan Tezgahı', cost: 2000, requires: 'anvil', pos: [-7, -0.2] },
  ],

  workers: [
    { id: 'lumberjack', name: 'Oduncu Cüce', icon: 'wood', look: 'dwarf-lumber', node: 'forest', base: 250 },
    { id: 'miner', name: 'Madenci Cüce', icon: 'ore', look: 'dwarf-miner', node: 'mine', base: 350 },
    { id: 'hauler', name: 'Çırak', icon: 'ingot', look: 'apprentice', hauler: true, base: 900, requires: 'anvil' },
  ],

  colliders: [
    { box: [-1.8, 1.8, -7.6, -5.5] },
    { box: [5.5, 8.5, -1.2, 0.7], requires: 'anvil' },
    { box: [-8.5, -5.5, -1.2, 0.7], requires: 'bench' },
    { box: [-8.8, -5.2, 10.4, 11.6] },
    { box: [5.2, 8.8, 10.4, 11.6], requires: 'anvil' },
    { box: [-0.8, 0.8, 10.1, 11.1] },
    { box: [-15.2, -10.6, 2.4, 5.6] },
    { box: [7.3, 10.7, -18, -16.4] },
  ],

  // Kraliyet Siparişi: 1. yıldız sonraki bölgeyi açar, 3. yıldız için 2. kademe süre sınırı içinde bitmeli
  // Sonsuz Kraliyet Siparişleri: ilk üçü elle, sonrakiler sonuncunun büyütülmüş hali
  orders: [{ ingot: 64 }, { sword: 80 }, { sword: 125, shield: 55 }],
  orderGrowth: 1.3,

  decor: [
    ['crates', -3, -6.8, 0.3], ['barrel', 2.6, -7.2], ['barrel', 3.2, -6.6],
    ['crates', -11.5, 11.5, 1.2], ['crates', 11.6, 11.5, -0.4], ['barrel', 12.4, 7.8], ['barrel', -12.2, 8.6],
    ['fence', -18, 16.8, 0, 10], ['fence', 0, 16.8, 0, 8], ['fence', 18, 16.8, 0, 10],
    ['fence', 13.8, -3, Math.PI / 2, 8], ['fence', -15.4, -6, Math.PI / 2, 8],
  ],

  tutorial: (g) => {
    const has = (t) => g.player.stack.count(t);
    const st = (k) => g.stats[k] || 0;
    return [
      { text: 'Ormana git ve odun topla', at: () => g.node('forest').zone, done: () => has('wood') >= 3 },
      { text: 'Madenden demir filizi kaz', at: () => g.node('mine').zone, done: () => has('ore') >= 3 },
      { text: 'Odun ve filizi dökümhaneye bırak', at: () => g.station('smelter').zone, done: () => st('drop_smelter') >= 2 },
      { text: 'Demir külçeleri ocaktan al', at: () => g.station('smelter').zone, done: () => has('ingot') >= 1 },
      { text: 'Külçeleri tüccar tezgahına koy', at: () => g.counter('market').zone, done: () => st('shelf_market') >= 1 },
      { text: 'Tüccarların bıraktığı altınları topla', at: () => g.counter('market').coinPos, done: () => st('collected') > 0 },
      { text: 'Kral için Kraliyet Sandığına külçe teslim et', at: () => g.chest.zone, done: () => g.deliveredTotal() >= 1 },
      { text: 'Altınla örsü inşa et', at: () => g.pad('anvil')?.pos, done: () => g.unlocked.has('anvil') },
      { text: 'Örse külçe ve odun getir', at: () => g.station('anvil').zone, done: () => st('made_sword') >= 1 },
      { text: 'Kılıçları silah tezgahına koy', at: () => g.counter('weapons').zone, done: () => st('shelf_weapons') >= 1 },
      { text: 'GELİŞTİR menüsünden işçi kirala', at: () => null, done: () => g.workers.length > 0 },
    ];
  },
};
