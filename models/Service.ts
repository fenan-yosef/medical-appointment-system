import mongoose, { Document, Schema } from 'mongoose';

interface IService extends Document {
  name: string;
  description?: string;
  department?: mongoose.Types.ObjectId;
  cost?: number;
  duration?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
  },
  cost: {
    type: Number,
  },
  duration: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ServiceSchema.pre<IService>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Service = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default Service;
export type { IService };
