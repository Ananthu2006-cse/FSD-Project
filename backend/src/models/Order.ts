import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PICKING' | 'READY' | 'DISPATCHED' | 'CANCELLED';

export interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
}

export interface IOrder extends Document {
  id: string;
  orderNumber: string;
  customerName: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  dispatchBay?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
  },
  { _id: false }
);

const OrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    customerName: {
      type: String,
      default: 'Standard Client Dispatch',
      trim: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'At least one order item is required'],
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PICKING', 'READY', 'DISPATCHED', 'CANCELLED'],
      default: 'PENDING',
    },
    dispatchBay: {
      type: String,
      default: 'Bay 01',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
