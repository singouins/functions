import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ITEM_RARITY = ['Broken', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
type ItemRarity = typeof ITEM_RARITY[number];

export interface IItem extends Document {
  _id: string;
  ammo?: number;
  bearer: string;
  bound: boolean;
  bound_type: string;
  created: Date;
  metatype: string;
  metaid: number;
  modded: boolean;
  mods: string[]; // Or any[] if mods contain objects
  offsetx?: number;
  offsety?: number;
  rarity: ItemRarity;
  state: number;
  updated: Date;
}

const ItemSchema = new Schema<IItem>({
  _id: { type: String, default: uuidv4 },

  ammo: { type: Number, default: null },

  bearer: { type: String, required: true },
  bound: { type: Boolean, required: true, default: true },
  bound_type: { type: String, required: true, default: 'BoP' },

  created: { type: Date, default: Date.now },

  metatype: { type: String, required: true },
  metaid: { type: Number, required: true },
  modded: { type: Boolean, required: true, default: false },
  mods: { type: [String], required: true, default: [] },

  offsetx: { type: Number, default: null },
  offsety: { type: Number, default: null },

  rarity: { type: String, enum: ITEM_RARITY, required: true, default: 'Common' },
  state: { type: Number, required: true, default: 100 },

  updated: { type: Date, default: Date.now }
}, {
  collection: 'items',
});

const Item = mongoose.model<IItem>('Item', ItemSchema);

export default Item;