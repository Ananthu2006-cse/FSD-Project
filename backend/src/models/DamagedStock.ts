import mongoose, { Document, Schema, Types } from 'mongoose';

export type DamagedStatus = 'REPORTED' | 'RESOLVED';

export interface IDamagedStock extends Document {
  id: string;
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  locationId: Types.ObjectId;
  quantity: number;
  reason: string;
  reportedBy: Types.ObjectId;
  status: DamagedStatus;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DamagedStockSchema: Schema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse reference is required'],
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Damaged quantity is required'],
      min: [1, 'Damaged quantity must be at least 1'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for damage is required'],
      trim: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting operator is required'],
    },
    status: {
      type: String,
      enum: ['REPORTED', 'RESOLVED'],
      default: 'REPORTED',
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
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

export const DamagedStock = mongoose.model<IDamagedStock>('DamagedStock', DamagedStockSchema);
export default DamagedStock;
