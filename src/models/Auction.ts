import mongoose, { Schema, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITEM_RARITIES } from '../globals';

type ItemRarity = typeof ITEM_RARITIES[number];

// --- Embedded subdocument schemas ---

// AuctionItem embedded document schema (like EmbeddedDocument)
const AuctionItemSchema = new Schema({
  // UUID stored as string, generated if not provided
  id: {
    type: String,
    default: null, // you can use uuidv4 if you want auto-generation here
  },
  metaid: {
    type: Number,
    required: true,
  },
  metatype: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rarity: {
    type: String,
    enum: ITEM_RARITIES,
    required: true,
  },
}, { _id: false }); // _id: false to not generate an ObjectId for embedded docs

// AuctionSeller embedded document schema
const AuctionSellerSchema = new Schema({
  id: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    required: true,
  },
}, { _id: false });

// --- Main Auction document schema ---

export interface IAuctionItem {
  id: string | null;
  metaid: number;
  metatype: string;
  name: string;
  rarity: ItemRarity;
}

export interface IAuctionSeller {
  id: string | null;
  name: string;
}

export interface IAuction extends Document {
  _id: string; // UUID string as primary key
  created: Date;
  item: IAuctionItem;
  price: number;
  seller: IAuctionSeller;
  updated: Date;
}

const AuctionSchema = new Schema<IAuction>({
  _id: {
    type: String,
    default: () => uuidv4(),
  },
  created: {
    type: Date,
    default: () => new Date(),
  },
  item: {
    type: AuctionItemSchema,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  seller: {
    type: AuctionSellerSchema,
    required: true,
  },
  updated: {
    type: Date,
    default: () => new Date(),
  },
}, {
  collection: 'auctions',
  versionKey: false,
});

// TTL index for 'created' field, expire after 48 hours (172800 seconds)
AuctionSchema.index({ created: 1 }, { expireAfterSeconds: 172800 });

const Auction = mongoose.model<IAuction>('Auction', AuctionSchema);

export default Auction;
