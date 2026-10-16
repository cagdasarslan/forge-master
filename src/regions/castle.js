// Bölge 3: Kömür Kalesi. Yüksek fırın ancak kömürle ısındığı sürece çelik üretir. Başkente Çelik gönderir.
export default {
  id: 'castle',
  name: 'Kömür Kalesi',
  icon: 'coal',
  map: { x: 80, y: 52 },
  intro: 'Yüksek fırını kömürle sıcak tut, demiri çeliğe çevir. Muhafızlara çelik zırh döv.',
  exports: 'steel',
  startGold: 0,
  theme: { grass: [0x7f9a5a, 0x74904f, 0x88a362], dirt: 0xa89a86, dirtDark: 0x8a7e6c, sky: 0xa9b9c6, road: 0x8a8478, floor: 'cobble', backdrop: 'castle' },

  layout: {
    bounds: { minX: -15, maxX: 15, minZ: -21, maxZ: 17 },
    spawn: [0, 1.5],
    roadZ: 19,
    tavern: [13, 4, -Math.PI / 2],
    tavernDoor: [10.9, 4],
    dirt: [[26, 22, 0, 1.5], [9, 7, 10, -13.5, 1], [7, 6, 0, -16, 1], [3, 6, 0, -10]],
  },

  nodes: [
    { id: 'coal', type: 'coal', label: 'KÖMÜR', zone: [0, -15.5], r: 2.1, visual: 'rocks', rock: 0x3c3a3a, speck: 0x1a1a1a },
    { id: 'mine', type: 'ore', label: 'MADEN', zone: [10, -12], r: 2.3, visual: 'rocks', rock: 0x7f7a74, speck: 0xd2753a, entrance: [10, -17] },
  ],

  stations: [
    { id: 'furnace', model: 'blastfurnace', label: 'YÜKSEK FIRIN', pos: [0, -6.5], zone: [0, -4.1], r: 1.5,
      recipe: { in: { ore: 2 }, out: 'steel', time: 3.5 }, fuel: { type: 'coal', burn: 6 } },
    { id: 'armory', model: 'armory', label: 'ZIRHHANE', pos: [7.5, 0], zone: [7.5, 2.6], r: 1.4, requires: 'armory',
      recipe: { in: { steel: 2, coal: 1 }, out: 'armor', time: 6 } },
    { id: 'smithy', model: 'triphammer', label: 'SU ÇEKİCİ', pos: [-7, -0.2], zone: [-7, 2.0], r: 1.4, requires: 'smithy',
      recipe: { in: { steel: 1, bronze: 1 }, out: 'steelsword', time: 4 } },
  ],

  counters: [
    { id: 'market', label: 'TÜCCAR', icon: 'steel', pos: [-7, 11], zone: [-7, 9.4], coins: [-10.2, 10.4], canopy: 'blue',
      customers: [{ look: 'merchant', wants: 'steel', need: [1, 3] }] },
    { id: 'weapons', label: 'ZIRH', icon: 'armor', pos: [7, 11], zone: [7, 9.4], coins: [10.2, 10.4], canopy: 'red', requires: 'armory',
      customers: [{ look: 'guard', wants: 'armor', need: [1, 1] }, { look: 'knight', wants: 'steelsword', need: [1, 2] }] },
  ],

  chest: { pos: [0, 10.6], zone: [0, 8.9], r: 1.25 },

  // Krallık Ambarı'ndan kervanla gelen mal (çelik kılıcın bronz kabzası)
  depot: { type: 'bronze', pos: [-11.5, 6], requires: 'smithy' },

  unlocks: [
    { id: 'armory', name: 'Zırhhane & Zırh Tezgahı', cost: 1800, pos: [7.5, 0] },
    { id: 'smithy', name: 'Su Çekici', cost: 5000, requires: 'armory', pos: [-7, -0.2] },
  ],

  workers: [
    { id: 'collier', name: 'Kömürcü Cüce', icon: 'coal', look: 'dwarf-coal', node: 'coal', base: 300 },
    { id: 'miner', name: 'Madenci Cüce', icon: 'ore', look: 'dwarf-miner', node: 'mine', base: 350 },
    { id: 'hauler', name: 'Çırak', icon: 'steel', look: 'apprentice', hauler: true, base: 1000, requires: 'armory' },
  ],

  guardian: {
    name: 'Kömür Devi', icon: 'giant', model: 'giant', hp: 62000,
    arena: [-10, -12],
    story: 'Kömür ocaklarının külünden doğan dev, nehir yolunu ateşle kapattı.',
  },
  army: [
    { id: 'pikeman', name: 'Kömürcü Milis', icon: 'coal', base: 900, dps: 22, look: 'soldier' },
    { id: 'guardsman', name: 'Zırhlı Muhafız', icon: 'armor', base: 3500, dps: 95, look: 'guard', requires: 'armory' },
    { id: 'knight', name: 'Çelik Şövalye', icon: 'steelsword', base: 9000, dps: 240, look: 'knight', requires: 'smithy' },
  ],
  colliders: [
    { box: [-1.8, 1.8, -7.6, -5.5] },
    { box: [5.7, 9.3, -1.4, 1.1], requires: 'armory' },
    { box: [-8.5, -5.5, -1.2, 0.7], requires: 'smithy' },
    { box: [-8.8, -5.2, 10.4, 11.6] },
    { box: [5.2, 8.8, 10.4, 11.6], requires: 'armory' },
    { box: [-0.8, 0.8, 10.1, 11.1] },
    { box: [11.4, 14.6, 1.9, 6.1] },
    { box: [8.3, 11.7, -18, -16.4] },
    { box: [-12.8, -10.2, 5.1, 6.4], requires: 'smithy' },
  ],

  orders: [{ steel: 115 }, { armor: 70 }, { armor: 105, steelsword: 88 }],
  orderGrowth: 1.3,

  decor: [
    ['torch', -2.4, -4.4], ['torch', 2.4, -4.4], ['torch', 5.2, 3.2],
    ['barrel', 2.6, -7.4], ['barrel', 3.2, -6.8], ['crates', -3.2, -7, 0.3],
    ['crates', -11.5, 11.5, 1.2], ['barrel', -12.2, 8.6], ['crates', 11.8, 11.6, -0.4],
    ['fence', -18, 16.8, 0, 10], ['fence', 0, 16.8, 0, 8], ['fence', 18, 16.8, 0, 10],
  ],

  tutorial: (g) => {
    const has = (t) => g.player.stack.count(t);
    const st = (k) => g.stats[k] || 0;
    return [
      { text: 'Madenden demir filizi kaz', at: () => g.node('mine').zone, done: () => has('ore') >= 2 },
      { text: 'Kömür ocağından kömür topla', at: () => g.node('coal').zone, done: () => has('coal') >= 2 },
      { text: 'Yüksek fırına filiz ve kömür bırak', at: () => g.station('furnace').zone, done: () => st('drop_furnace') >= 3 },
      { text: 'Fırın kömürle ısınınca çeliği al', at: () => g.station('furnace').zone, done: () => has('steel') >= 1 },
      { text: 'Çeliği tüccara sat', at: () => g.counter('market').zone, done: () => st('shelf_market') >= 1 },
      { text: 'Zırhhaneyi inşa et', at: () => g.pad('armory')?.pos, done: () => g.unlocked.has('armory') },
      { text: 'Zırhhaneye çelik ve kömür getir', at: () => g.station('armory').zone, done: () => st('made_armor') >= 1 },
      { text: 'Çeliği Kraliyet Sandığına teslim et', at: () => g.chest.zone, done: () => g.deliveredTotal() >= 1 },
    ];
  },
};
