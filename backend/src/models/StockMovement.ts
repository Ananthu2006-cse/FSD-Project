import mongoose, { Document, Schema, Types } from 'mongoose';

export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface IStockMovement extends Document {
  id: string;
  type: MovementType;
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  locationId: Types.ObjectId;
  toWarehouseId?: Types.ObjectId;
  toLocationId?: Types.ObjectId;
  quantity: number;
  reason: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'],
      required: [true, 'Movement type is required'],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Source warehouse is required'],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Source location is required'],
    },
    toWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    toLocationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who performed movement is required'],
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

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
export default StockMovement;
