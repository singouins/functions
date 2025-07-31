// globals.ts

export const ITEM_RARITIES = [
  'Broken',
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
] as const;

type AmmoEntry = {
  price: number;
  emoji: string;
};

const AMMO_BULLET: Record<string, AmmoEntry> = {
  cal22:   { price: 0.1, emoji: 'ammoCal22' },
  cal223:  { price: 0.3, emoji: 'ammoCal223' },
  cal311:  { price: 0.5, emoji: 'ammoCal311' },
  cal50:   { price: 1,   emoji: 'ammoCal50' },
  cal55:   { price: 2,   emoji: 'ammoCal55' },
};

const AMMO_SPECIAL: Record<string, AmmoEntry> = {
  arrow:   { price: 1, emoji: 'ammoArrow' },
  bolt:    { price: 1, emoji: 'ammoBolt' },
  fuel:    { price: 1, emoji: 'ammoFuel' },
  grenade: { price: 1, emoji: 'ammoGrenade' },
  rocket:  { price: 1, emoji: 'ammoRocket' },
  shell:   { price: 1, emoji: 'ammoShell' },
};

export const AMMUNITIONS: Record<string, AmmoEntry> = {
  ...AMMO_BULLET,
  ...AMMO_SPECIAL,
};