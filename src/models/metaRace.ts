import mongoose, { Schema, Document } from 'mongoose';

export interface IMetaRace extends Document {
  _id: number;          // numeric ID
  lootable: boolean;
  max_b: number;
  max_g: number;
  max_level: number;
  max_m: number;
  max_p: number;
  max_r: number;
  max_v: number;
  min_b: number;
  min_g: number;
  min_level: number;
  min_m: number;
  min_p: number;
  min_r: number;
  min_v: number;
  name: string;
}

const MetaRaceSchema = new Schema<IMetaRace>({
  _id: { type: Number, required: true },
  lootable: { type: Boolean, required: true },
  max_b: { type: Number, required: true },
  max_g: { type: Number, required: true },
  max_level: { type: Number, required: true },
  max_m: { type: Number, required: true },
  max_p: { type: Number, required: true },
  max_r: { type: Number, required: true },
  max_v: { type: Number, required: true },
  min_b: { type: Number, required: true },
  min_g: { type: Number, required: true },
  min_level: { type: Number, required: true },
  min_m: { type: Number, required: true },
  min_p: { type: Number, required: true },
  min_r: { type: Number, required: true },
  min_v: { type: Number, required: true },
  name: { type: String, required: true },
}, {
  collection: 'metaRace',    // adjust if your collection name differs
  versionKey: false,         // remove __v if not needed
});

const metaRace = mongoose.model<IMetaRace>('MetaRace', MetaRaceSchema);

export default metaRace;
