// Bölge 5: Kristal Mağaraları. Karanlıkta fenerle kristal kaz; derin damar meşale dikilince açılır.
// Başkente Ruh Kristali gönderir.
export default {
  id: 'caves',
  name: 'Kristal Mağaraları',
  icon: 'crystal',
  map: { x: 18, y: 26 },
  intro: 'Mağara karanlık; fenerinin aydınlattığı yerde kristal kaz. Büyücülere asa sat.',
  exports: 'crystal',
  startGold: 0,
  theme: { grass: [0x3b3a4a, 0x34333f, 0x423f52], dirt: 0x4a4458, dirtDark: 0x3a3646, sky: 0x120f1c, road: 0x3a3446, border: 'crystals', floor: 'cave', backdrop: 'cave' },
  // karanlık sahne: zayıf ortam ışığı, oyuncunun elinde fener
  light: { hemi: 0.3, sun: 0.28, exposure: 1.15, lantern: true },

  layout: {
    bounds: { minX: -15, maxX: 15, minZ: -21, maxZ: 17 },
    spawn: [0, 1.5],
    roadZ: 19,
    tavern: [-12.9, 4, Math.PI / 2],
    tavernDoor: [-12.5, 6.2],
    dirt: [[26, 22, 0, 1.5, 1]],
  },

  nodes: [
    { id: 'vein', type: 'crystalore', label: 'KRİSTAL', zone: [-8, -11], r: 2.2, visual: 'crystals', color: 0x9a7aff, speck: 0x9a7aff },
    { id: 'deep', type: 'crystalore', label: 'DERİN DAMAR', zone: [8, -15], r: 2.2, visual: 'crystals', color: 0xd77aff, speck: 0xd77aff, requires: 'torches', rate: 0.8 },
    { id: 'spring', type: 'mana', label: 'MANA', zone: [9, -4], r: 1.9, visual: 'spring', speck: 0x4fc3ff },
  ],

  stations: [
    { id: 'cutter', model: 'grinder', label: 'ÖĞÜTÜCÜ', pos: [-1, -6.5], zone: [-1, -4.2], r: 1.4,
      recipe: { in: { crystalore: 2, mana: 1 }, out: 'crystal', time: 5 } },
    { id: 'enchant', model: 'altar', label: 'BÜYÜ SUNAĞI', pos: [-7.5, 1], zone: [-7.5, 3.2], r: 1.4, requires: 'magic',
      recipe: { in: { crystal: 1, goldleaf: 1 }, out: 'staff', time: 6 } },
  ],

  counters: [
    { id: 'market', label: 'TÜCCAR', icon: 'crystal', pos: [-7, 11], zone: [-7, 9.4], coins: [-10.2, 10.4], canopy: 'blue',
      customers: [{ look: 'merchant', wants: 'crystal', need: [1, 2] }] },
    { id: 'tower', label: 'BÜYÜCÜ', icon: 'staff', pos: [7, 11], zone: [7, 9.4], coins: [10.2, 10.4], canopy: 'purple', requires: 'magic',
      customers: [{ look: 'wizard', wants: 'staff', need: [1, 1] }] },
  ],

  chest: { pos: [0, 10.6], zone: [0, 8.9], r: 1.25 },

  // Krallık Ambarı'ndan kervanla gelen mal (asanın altın varağı)
  depot: { type: 'goldleaf', pos: [-3.6, 5.6], requires: 'magic' },

  unlocks: [
    { id: 'torches', name: 'Derin Damar Meşaleleri', cost: 4500, pos: [8, -15] },
    { id: 'magic', name: 'Büyü Sunağı & Büyücü Tezgahı', cost: 12000, requires: 'torches', pos: [-7.5, 1] },
  ],

  workers: [
    { id: 'crystalMiner', name: 'Kristalci Cüce', icon: 'crystalore', look: 'dwarf-miner', node: 'vein', base: 600 },
    { id: 'deepMiner', name: 'Derin Kazıcı', icon: 'crystal', look: 'dwarf-coal', node: 'deep', base: 1000, requires: 'torches' },
    { id: 'waterer', name: 'Mana Taşıyıcı', icon: 'mana', look: 'apprentice', node: 'spring', base: 700 },
    { id: 'hauler', name: 'Çırak', icon: 'crystal', look: 'apprentice', hauler: true, base: 2400, requires: 'magic' },
  ],

  guardian: {
    name: 'Kristal Örümcek Kraliçesi', icon: 'spider', power: 1450,
    story: 'Mağaranın en derininde ağ ören kraliçe, ejderha dağına giden tüneli kristal ağlarla kapattı.',
  },
  army: [
    { id: 'lantern', name: 'Fenerci', icon: 'crystalore', base: 2500, power: 60 },
    { id: 'mage', name: 'Kristal Büyücü', icon: 'crystal', base: 10000, power: 260, requires: 'torches' },
    { id: 'archmage', name: 'Baş Büyücü', icon: 'staff', base: 25000, power: 650, requires: 'magic' },
  ],
  colliders: [
    { box: [-2.5, 0.5, -7.5, -5.6] },
    { box: [-9, -6, 0, 1.9], requires: 'magic' },
    { box: [-8.8, -5.2, 10.4, 11.6] },
    { box: [5.2, 8.8, 10.4, 11.6], requires: 'magic' },
    { box: [-0.8, 0.8, 10.1, 11.1] },
    { box: [-15.2, -10.6, 2.4, 5.6] },
    { box: [-4.9, -2.3, 4.7, 6.0], requires: 'magic' },
  ],

  orders: [{ crystal: 150 }, { crystal: 260, staff: 20 }, { staff: 45, crystal: 400 }],
  orderGrowth: 1.3,

  decor: [
    ['torch', -2.8, -3.6], ['torch', 1.4, -3.6], ['torch', -9.6, 3.8], ['torch', 3.4, 9], ['torch', -3.6, 9],
    ['crystal', -14, -6, 0, 0x9a7aff], ['crystal', 13.5, -9, 0, 0x4fc3ff], ['crystal', 12.8, 5, 0, 0xd77aff], ['crystal', -13.6, 12, 0, 0x4fc3ff],
    ['crystal', 2.5, -18, 0, 0x9a7aff], ['crystal', -4, -19, 0, 0x4fc3ff],
    ['barrel', 2.2, -7.2], ['crates', -12, 9, 1.1],
  ],

  tutorial: (g) => {
    const has = (t) => g.player.stack.count(t);
    const st = (k) => g.stats[k] || 0;
    return [
      { text: 'Fenerinle kristal damarını kaz', at: () => g.node('vein').zone, done: () => has('crystalore') >= 2 },
      { text: 'Mana kaynağından su doldur', at: () => g.node('spring').zone, done: () => has('mana') >= 1 },
      { text: 'Damar ve manayı öğütücüye bırak', at: () => g.station('cutter').zone, done: () => st('drop_cutter') >= 3 },
      { text: 'Ruh kristalini al', at: () => g.station('cutter').zone, done: () => has('crystal') >= 1 },
      { text: 'Kristalleri tüccara sat', at: () => g.counter('market').zone, done: () => st('shelf_market') >= 1 },
      { text: 'Derin damara meşale dik', at: () => g.pad('torches')?.pos, done: () => g.unlocked.has('torches') },
      { text: 'Büyü sunağını kur', at: () => g.pad('magic')?.pos, done: () => g.unlocked.has('magic') },
      { text: 'Sunağa kristal ve kervandan gelen varağı getir', at: () => g.station('enchant').zone, done: () => st('made_staff') >= 1 },
      { text: 'Kraliyet Sandığına kristal teslim et', at: () => g.chest.zone, done: () => g.deliveredTotal() >= 1 },
    ];
  },
};
