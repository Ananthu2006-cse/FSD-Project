import mongoose, { Document, Schema, Types } from 'mongoose';

export type LocationStatus = 'ACTIVE' | 'INACTIVE';

export interface ILocation extends Document {
  id: string;
  warehouseId: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  status: LocationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema: Schema = new Schema(
  {
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'Warehouse reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Location code is required'],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.warehouseId = ret.warehouseId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index: code unique per warehouse
LocationSchema.index({ warehouseId: 1, code: 1 }, { unique: true });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
export default Location;
