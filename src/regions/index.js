// Krallık haritasındaki bölgeler. Sıra, açılış sırasıdır: bir bölge, öncekinde 1 yıldız alınca açılır.
import village from './village.js';
import valley from './valley.js';
import castle from './castle.js';
import river from './river.js';
import caves from './caves.js';
import dragon from './dragon.js';

export const REGIONS = [village, valley, castle, river, caves, dragon];

export const CAPITAL = { id: 'capital', name: 'Başkent', map: { x: 50, y: 40 } };

export const regionById = (id) => REGIONS.find((r) => r.id === id);
export const regionIndex = (id) => REGIONS.findIndex((r) => r.id === id);
