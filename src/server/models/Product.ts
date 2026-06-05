import mongoose, { Document, Model } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  genres: string[];
  images: {
    main: string;
    trailer?: string;
  };
  inventory: {
    S: number;
    M: number;
    L: number;
  };
  rating: number;
  reviewCount: number;
  isBoxOfficeHit: boolean;
}

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  genres: [String],
  images: {
    main: { type: String, required: true },
    trailer: { type: String },
  },
  inventory: {
    S: { type: Number, default: 0 },
    M: { type: Number, default: 0 },
    L: { type: Number, default: 0 },
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  isBoxOfficeHit: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Product = (mongoose.models.Product as Model<IProduct>) || mongoose.model<IProduct>("Product", productSchema);
export default Product;
