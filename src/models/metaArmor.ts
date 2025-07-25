import mongoose, { Schema, Document } from 'mongoose';

export interface IMetaArmor extends Document {
  _id: number;
  arpen: number;
  burst_acc: number | null;
  caliber: string | null;
  defcan: number;
  dmg_base: number;
  dmg_radius: number | null;
  dmg_shape: string | null;
  dmg_sneaky: number;
  mastery: string | null;
  max_ammo: number | null;
  min_b: number;
  min_g: number;
  min_m: number;
  min_p: number;
  min_r: number;
  min_v: number;
  moddable: boolean;
  name: string;
  onehanded: boolean;
  parry: number;
  pas_reload: number | null;
  pas_use: number;
  ranged: boolean;
  rng: number | null;
  rounds: number | null;
  size: string;
  tier: number;
}

const MetaArmorSchema: Schema = new Schema<IMetaArmor>({
  _id: { type: Number, required: true },
  arpen: { type: Number, required: true },
  burst_acc: { type: Number, default: null },
  caliber: { type: String, default: null },
  defcan: { type: Number, required: true },
  dmg_base: { type: Number, required: true },
  dmg_radius: { type: Number, default: null },
  dmg_shape: { type: String, default: null },
  dmg_sneaky: { type: Number, required: true },
  mastery: { type: String, default: null },
  max_ammo: { type: Number, default: null },
  min_b: { type: Number, required: true },
  min_g: { type: Number, required: true },
  min_m: { type: Number, required: true },
  min_p: { type: Number, required: true },
  min_r: { type: Number, required: true },
  min_v: { type: Number, required: true },
  moddable: { type: Boolean, required: true },
  name: { type: String, required: true },
  onehanded: { type: Boolean, required: true },
  parry: { type: Number, required: true },
  pas_reload: { type: Number, default: null },
  pas_use: { type: Number, required: true },
  ranged: { type: Boolean, required: true },
  rng: { type: Number, default: null },
  rounds: { type: Number, default: null },
  size: { type: String, required: true },
  tier: { type: Number, required: true }
}, {
  collection: '_metaArmors'
});

const metaArmor = mongoose.model<IMetaArmor>('metaArmor', MetaArmorSchema);

export default metaArmor;