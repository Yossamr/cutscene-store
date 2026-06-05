import mongoose, { Document, Model } from "mongoose";

export interface IUser extends Document {
  phone: string;
  password?: string;
  name: string;
  role: string;
  preferences?: {
    favoriteGenres?: string[];
  };
  watchlist?: mongoose.Types.ObjectId[];
}

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },
  preferences: {
    favoriteGenres: [String],
  },
  watchlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  }],
}, { timestamps: true });

const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", userSchema);
export default User;
