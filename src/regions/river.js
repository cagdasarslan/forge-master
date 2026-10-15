// Bölge 4: Altın Nehri. Kıyıdan kum topla, elemede şansına göre altın çıkar. Başkente Altın Varak gönderir.
export default {
  id: 'river',
  name: 'Altın Nehri',
  icon: 'goldleaf',
  map: { x: 30, y: 55 },
  intro: 'Nehir kumunu ele; her eleme altın vermez. Altını varağa döv, soylulara taç sat.',
  exports: 'goldleaf',
  startGold: 0,
  theme: { grass: [0x6fbf5a, 0x63b350, 0x7cc866], dirt: 0xd9c08a, dirtDark: 0xc4a874, sky: 0xa6dcef, floor: 'sand', backdrop: 'river' },

  layout: {
    bounds: { minX: -15, maxX: 15, minZ: -21, maxZ: 17 },
    spawn: [-2, 1],
    roadZ: 19,
    tavern: [-12.9, 4, Math.PI / 2],
    tavernDoor: [-12.5, 6.2],
    dirt: [[22, 22, -3, 1.5], [5, 8, 6, -7, 1]],
    river: { x: 9.6, w: 2.6, bridgeZ: null },
  },

  nodes: [
    { id: 'bank', type: 'sand', label: 'KUM', zone: [6.3, -7], r: 1.9, visual: 'mounds', speck: 0xe2c27a },
    { id: 'forest', type: 'wood', label: 'ORMAN', zone: [-10, -13], r: 2.3, visual: 'trees' },
  ],

  stations: [
    { id: 'sluice', model: 'sluice', label: 'ELEME', pos: [0, -7], zone: [0, -4.8], r: 1.4,
      recipe: { in: { sand: 1 }, out: 'nugget', time: 1.6, chance: 0.65 } },
    { id: 'refinery', model: 'crucible', label: 'VARAK OCAĞI', pos: [-7.5, -1], zone: [-7.5, 1.4], r: 1.5, requires: 'leaf',
      recipe: { in: { nugget: 1, wood: 1 }, out: 'goldleaf', time: 3 } },
    { id: 'jeweler', model: 'jeweler', label: 'KUYUMCU', pos: [3.5, 1.5], zone: [3.5, 3.7], r: 1.4, requires: 'crown',
      recipe: { in: { goldleaf: 2, steel: 1 }, out: 'crown', time: 6 } },
  ],

  counters: [
    { id: 'market', label: 'TÜCCAR', icon: 'nugget', pos: [-7, 11], zone: [-7, 9.4], coins: [-10.2, 10.4], canopy: 'green',
      customers: [{ look: 'merchant', wants: 'nugget', need: [1, 3] }, { look: 'merchant', wants: 'goldleaf', need: [1, 3] }] },
    { id: 'palace', label: 'SARAY', icon: 'crown', pos: [3.6, 11], zone: [3.6, 9.4], coins: [6.2, 10.4], canopy: 'purple', requires: 'crown',
      customers: [{ look: 'noble', wants: 'crown', need: [1, 1] }] },
  ],

  chest: { pos: [-1.8, 10.6], zone: [-1.8, 8.9], r: 1.2 },

  // Krallık Ambarı'ndan kervanla gelen mal (tacın çelik iskeleti)
  depot: { type: 'steel', pos: [-6, 5.3], requires: 'crown' },

  unlocks: [
    { id: 'leaf', name: 'Varak Ocağı', cost: 3500, pos: [-7.5, -1] },
    { id: 'crown', name: 'Kuyumcu & Saray Tezgahı', cost: 10000, requires: 'leaf', pos: [3.5, 1.5] },
  ],

  workers: [
    { id: 'sander', name: 'Elekçi Cüce', icon: 'sand', look: 'dwarf-miner', node: 'bank', base: 600 },
    { id: 'lumberjack', name: 'Oduncu Cüce', icon: 'wood', look: 'dwarf-lumber', node: 'forest', base: 700, requires: 'leaf' },
    { id: 'hauler', name: 'Çırak', icon: 'nugget', look: 'apprentice', hauler: true, base: 2200, requires: 'leaf' },
  ],

  guardian: {
    name: 'Altın Timsah', icon: 'croc', power: 1600,
    story: 'Altın pullarla kaplı dev timsah, mağaralara giden geçidi koruyor. Nehirden geçen her kayığı yutuyor.',
  },
  army: [
    { id: 'archer', name: 'Nehir Okçusu', icon: 'bow', base: 2000, power: 50 },
    { id: 'palace', name: 'Saray Muhafızı', icon: 'goldleaf', base: 8000, power: 210, requires: 'leaf' },
    { id: 'goldknight', name: 'Altın Şövalye', icon: 'crown', base: 20000, power: 540, requires: 'crown' },
  ],
  colliders: [
    { box: [-1.5, 1.5, -8, -6.1] },
    { box: [-9.3, -5.7, -2.1, 0], requires: 'leaf' },
    { box: [2, 5, 0.3, 2.2], requires: 'crown' },
    { box: [-8.8, -5.2, 10.4, 11.6] },
    { box: [1.8, 5.4, 10.4, 11.6], requires: 'crown' },
    { box: [-2.6, -1, 10.1, 11.1] },
    { box: [-15.2, -10.6, 2.4, 5.6] },
    { box: [-7.3, -4.7, 4.4, 5.7], requires: 'crown' },
  ],

  orders: [{ nugget: 220 }, { goldleaf: 195 }, { goldleaf: 270, crown: 66 }],
  orderGrowth: 1.3,

  decor: [
    ['crates', -3.2, -6.4, 0.3], ['barrel', 2.4, -6.6], ['barrel', -11.8, 8.8],
    ['crates', -11.5, 11.5, 1.2], ['barrel', 6.6, 7.4],
    ['fence', -18, 16.8, 0, 10], ['fence', -2, 16.8, 0, 6], ['fence', 16, 16.8, 0, 8],
  ],

  tutorial: (g) => {
    const has = (t) => g.player.stack.count(t);
    const st = (k) => g.stats[k] || 0;
    return [
      { text: 'Nehir kıyısından kum topla', at: () => g.node('bank').zone, done: () => has('sand') >= 3 },
      { text: 'Kumu eleme teknesine bırak', at: () => g.station('sluice').zone, done: () => st('drop_sluice') >= 2 },
      { text: 'Elemeden çıkan altını al', at: () => g.station('sluice').zone, done: () => has('nugget') >= 1 },
      { text: 'Altınları tüccara sat', at: () => g.counter('market').zone, done: () => st('shelf_market') >= 1 },
      { text: 'Varak ocağını inşa et', at: () => g.pad('leaf')?.pos, done: () => g.unlocked.has('leaf') },
      { text: 'Varak ocağına altın ve odun getir', at: () => g.station('refinery').zone, done: () => st('made_goldleaf') >= 1 },
      { text: 'Kral için Kraliyet Sandığına altın teslim et', at: () => g.chest.zone, done: () => g.deliveredTotal() >= 1 },
    ];
  },
};
