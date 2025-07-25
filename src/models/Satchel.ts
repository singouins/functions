import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Interfaces for Embedded Sub-Documents

interface SatchelResource {
  fur: number;
  leather: number;
  meat: number;
  ore: number;
  skin: number;
}

interface SatchelShard {
  broken: number;
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
  [key: string]: number;
}

export interface SatchelAmmo {
  arrow: number;
  bolt: number;
  cal22: number;
  cal223: number;
  cal311: number;
  cal50: number;
  cal55: number;
  fuel: number;
  grenade: number;
  rocket: number;
  shell: number;
}

interface SatchelCurrency {
  banana: number;
  sausage: number;
}

// Main Satchel Interface
export interface ISatchel extends Document {
  _id: string;
  ammo: SatchelAmmo;
  currency: SatchelCurrency;
  resource: SatchelResource;
  shard: SatchelShard;
  updated: Date;
}

// Schemas for Embedded Sub-Documents

const SatchelResourceSchema = new Schema<SatchelResource>({
  fur: { type: Number, required: true, default: 0 },
  leather: { type: Number, required: true, default: 0 },
  meat: { type: Number, required: true, default: 0 },
  ore: { type: Number, required: true, default: 0 },
  skin: { type: Number, required: true, default: 0 },
}, { _id: false });

const SatchelShardSchema = new Schema<SatchelShard>({
  broken: { type: Number, required: true, default: 0 },
  common: { type: Number, required: true, default: 0 },
  uncommon: { type: Number, required: true, default: 0 },
  rare: { type: Number, required: true, default: 0 },
  epic: { type: Number, required: true, default: 0 },
  legendary: { type: Number, required: true, default: 0 },
}, { _id: false });

const SatchelAmmoSchema = new Schema<SatchelAmmo>({
  arrow: { type: Number, required: true, default: 0 },
  bolt: { type: Number, required: true, default: 0 },
  cal22: { type: Number, required: true, default: 0 },
  cal223: { type: Number, required: true, default: 0 },
  cal311: { type: Number, required: true, default: 0 },
  cal50: { type: Number, required: true, default: 0 },
  cal55: { type: Number, required: true, default: 0 },
  fuel: { type: Number, required: true, default: 0 },
  grenade: { type: Number, required: true, default: 0 },
  rocket: { type: Number, required: true, default: 0 },
  shell: { type: Number, required: true, default: 0 },
}, { _id: false });

const SatchelCurrencySchema = new Schema<SatchelCurrency>({
  banana: { type: Number, required: true, default: 0 },
  sausage: { type: Number, required: true, default: 0 },
}, { _id: false });

// Main Schema
const SatchelSchema = new Schema<ISatchel>({
  _id: { type: String, default: uuidv4 },
  ammo: { type: SatchelAmmoSchema, required: true },
  currency: { type: SatchelCurrencySchema, required: true },
  resource: { type: SatchelResourceSchema, required: true },
  shard: { type: SatchelShardSchema, required: true },
  updated: { type: Date, default: Date.now },
}, {
  collection: 'satchels',
});

const Satchel = mongoose.model<ISatchel>('Satchel', SatchelSchema);

export default Satchel;
