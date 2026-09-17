import mongoose, { Document, Schema } from 'mongoose';

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface IWarehouse extends Document {
  id: string;
  name: string;
  code: string;
  address: string;
  description: string;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
export default Warehouse;
