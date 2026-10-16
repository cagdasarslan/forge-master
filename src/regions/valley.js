// Bölge 2: Bakır Vadisi. Bakır + kalay → bronz, mızrak, miğfer. Kalay madeni nehrin karşısında: önce köprü.
export default {
  id: 'valley',
  name: 'Bakır Vadisi',
  icon: 'spear',
  map: { x: 62, y: 74 },
  intro: 'Nehre köprü kur, bakır ve kalayı bronza dönüştür. Lejyonerlere mızrak sat.',
  exports: 'bronze',
  startGold: 350,
  theme: { grass: [0x8cbf4f, 0x7fb247, 0x9acb5a], dirt: 0xc49a6c, dirtDark: 0xa98458, sky: 0xa8d8e0, floor: 'earth', backdrop: 'hills' },

  layout: {
    bounds: { minX: -15, maxX: 15, minZ: -21, maxZ: 17 },
    spawn: [-3, 3],
    roadZ: 19,
    tavern: [-13.4, 4.5, Math.PI / 2],
    tavernDoor: [-12.9, 6.9],
    dirt: [[17, 22, -5.5, 2], [8, 7, -1, -15.5, 1], [7, 6, 10.5, -8.5, 1]],
    river: { x: 5, w: 1.3, bridgeZ: -2, bridge: 'bridge' },
  },

  nodes: [
    { id: 'forest', type: 'wood', label: 'ORMAN', zone: [-10, -13], r: 2.3, visual: 'trees' },
    { id: 'copper', type: 'copper', label: 'BAKIR', zone: [-1, -14], r: 2.3, visual: 'rocks', rock: 0x8a6a55, speck: 0xd9813a, entrance: [-1, -19] },
    { id: 'tin', type: 'tin', label: 'KALAY', zone: [10.5, -8], r: 2.2, visual: 'rocks', rock: 0x8f949c, speck: 0xe8eef4 },
  ],

  stations: [
    { id: 'furnace', model: 'kiln', label: 'BRONZ OCAĞI', pos: [-3, -5.5], zone: [-3, -3.1], r: 1.5,
      recipe: { in: { copper: 1, tin: 1 }, out: 'bronze', time: 3 } },
    { id: 'spear', model: 'spearshop', label: 'MIZRAKÇI', pos: [-10, 1], zone: [-10, 3.2], r: 1.4, requires: 'spear',
      recipe: { in: { bronze: 1, wood: 1 }, out: 'spear', time: 4 } },
    { id: 'helmet', model: 'mould', label: 'MİĞFERCİ', pos: [1, 1.5], zone: [1, 3.7], r: 1.4, requires: 'helmet',
      recipe: { in: { bronze: 1, ingot: 1 }, out: 'helmet', time: 5 } },
  ],

  counters: [
    { id: 'market', label: 'TÜCCAR', icon: 'bronze', pos: [-9, 11], zone: [-9, 9.4], coins: [-12.2, 10.4], canopy: 'green',
      customers: [{ look: 'merchant', wants: 'bronze', need: [1, 4] }, { look: 'merchant', wants: 'copper', need: [2, 5] }] },
    { id: 'weapons', label: 'SİLAH', icon: 'spear', pos: [1.5, 11], zone: [1.5, 9.4], coins: [-1.3, 10.4], canopy: 'blue', requires: 'spear',
      customers: [{ look: 'legionary', wants: 'spear', need: [1, 2] }, { look: 'centurion', wants: 'helmet', need: [1, 2] }] },
  ],

  chest: { pos: [-4.4, 10.6], zone: [-4.4, 8.9], r: 1.2 },

  // Krallık Ambarı'ndan kervanla gelen mal (miğfer için demir külçe)
  depot: { type: 'ingot', pos: [-7.5, 5.2], requires: 'helmet' },

  unlocks: [
    { id: 'bridge', name: 'Nehir Köprüsü', cost: 300, pos: [5, -2] },
    { id: 'spear', name: 'Mızrakçı & Silah Tezgahı', cost: 1300, requires: 'bridge', pos: [-10, 1] },
    { id: 'helmet', name: 'Miğferci', cost: 4500, requires: 'spear', pos: [1, 1.5] },
  ],

  workers: [
    { id: 'lumberjack', name: 'Oduncu Cüce', icon: 'wood', look: 'dwarf-lumber', node: 'forest', base: 250 },
    { id: 'copperMiner', name: 'Bakırcı Cüce', icon: 'copper', look: 'dwarf-miner', node: 'copper', base: 350 },
    { id: 'tinMiner', name: 'Kalaycı Cüce', icon: 'tin', look: 'dwarf-coal', node: 'tin', base: 450, requires: 'bridge' },
    { id: 'hauler', name: 'Çırak', icon: 'bronze', look: 'apprentice', hauler: true, base: 900, requires: 'spear' },
  ],

  guardian: {
    name: 'Bakır Basilisk', icon: 'serpent', model: 'serpent', hp: 29000,
    arena: [11, 5],
    story: 'Bakır kayalıklarda yuvalanan Basilisk, kaleye giden geçidi tutuyor. Bakışı askerleri taşa çevirir.',
  },
  army: [
    { id: 'slinger', name: 'Çoban Sapancı', icon: 'copper', base: 400, dps: 10, look: 'soldier' },
    { id: 'spearman', name: 'Mızrakçı', icon: 'spear', base: 1600, dps: 45, look: 'legionary', requires: 'spear' },
    { id: 'legionary', name: 'Lejyoner', icon: 'helmet', base: 4500, dps: 120, look: 'centurion', requires: 'helmet' },
  ],
  colliders: [
    { box: [-4.8, -1.2, -6.6, -4.5] },
    { box: [-11.5, -8.5, -0.2, 1.7], requires: 'spear' },
    { box: [-0.5, 2.5, 0.3, 2.2], requires: 'helmet' },
    { box: [-10.8, -7.2, 10.4, 11.6] },
    { box: [-0.3, 3.3, 10.4, 11.6], requires: 'spear' },
    { box: [-5.2, -3.6, 10.1, 11.1] },
    { box: [-15.7, -11.1, 2.9, 6.1] },
    { box: [-8.8, -6.2, 4.3, 5.6], requires: 'helmet' },
    { box: [-2.7, 0.7, -20, -18.4] },
  ],

  orders: [{ bronze: 85 }, { spear: 105 }, { spear: 145, helmet: 50 }],
  orderGrowth: 1.3,

  decor: [
    ['crates', -6.5, -6.2, 0.4], ['barrel', -0.6, -6.4], ['barrel', 0.1, -5.8],
    ['crates', -13, 11.6, 1.1], ['barrel', 3.6, 7.8], ['barrel', -13.6, 8.8],
    ['fence', -16, 16.8, 0, 10], ['fence', -4, 16.8, 0, 8], ['fence', 14, 16.8, 0, 8],
    ['crates', 13.2, -4.2, 0.6],
  ],

  tutorial: (g) => {
    const has = (t) => g.player.stack.count(t);
    const st = (k) => g.stats[k] || 0;
    return [
      { text: 'Nehre köprü kur', at: () => g.pad('bridge')?.pos, done: () => g.unlocked.has('bridge') },
      { text: 'Bakır madeninden bakır kaz', at: () => g.node('copper').zone, done: () => has('copper') >= 3 },
      { text: 'Köprüden geç, kalay topla', at: () => g.node('tin').zone, done: () => has('tin') >= 3 },
      { text: 'Bakır ve kalayı bronz ocağına bırak', at: () => g.station('furnace').zone, done: () => st('drop_furnace') >= 2 },
      { text: 'Bronzları ocaktan al', at: () => g.station('furnace').zone, done: () => has('bronze') >= 1 },
      { text: 'Bronzları tüccara sat', at: () => g.counter('market').zone, done: () => st('shelf_market') >= 1 },
      { text: 'Mızrakçıyı inşa et', at: () => g.pad('spear')?.pos, done: () => g.unlocked.has('spear') },
      { text: 'Mızrakçıya bronz ve odun getir', at: () => g.station('spear').zone, done: () => st('made_spear') >= 1 },
      { text: 'Kral için Kraliyet Sandığına bronz ya da mızrak teslim et', at: () => g.chest.zone, done: () => g.deliveredTotal() >= 1 },
    ];
  },
};
