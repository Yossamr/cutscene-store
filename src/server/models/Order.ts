import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    size: string;
    quantity: number;
    price: number;
  }[];
  shippingDetails: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalAmount: number;
  promoCode?: string;
  discountPercentage?: number;
  barcodeUrl: string;
  status: string;
  paymentIntentId: string;
}

const OrderSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    shippingDetails: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    totalAmount: { type: Number, required: true },
    promoCode: { type: String },
    discountPercentage: { type: Number },
    barcodeUrl: { type: String, required: true },
    status: { type: String, default: "Processing" },
    paymentIntentId: { type: String, required: true },
  },
  { timestamps: true }
);

const Order = (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
