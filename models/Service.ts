import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IService extends Document {
  title: string;
  description: string;
  category: Types.ObjectId;
  provider: Types.ObjectId;
  price: number;
  priceType: 'hourly' | 'fixed' | 'negotiable';
  tags: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  deliveryTime?: string;
  mobile: string;
  whatsapp: string;
  videoUrl?: string;
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, required: true },
    category:     { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    provider:     { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    price:        { type: Number, required: true, min: 0 },
    priceType:    { type: String, enum: ['hourly', 'fixed', 'negotiable'], default: 'hourly' },
    tags:         [{ type: String }],
    images:       [{ type: String }],
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:  { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
    deliveryTime: { type: String },
    mobile:       { type: String, default: '' },
    whatsapp:     { type: String, default: '' },
    videoUrl:     { type: String, default: '' },
    customFields: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, strict: false }   // strict:false so dynamic fields are never silently dropped
);

ServiceSchema.index({ title: 'text', description: 'text', tags: 'text' });
ServiceSchema.index({ category: 1, isActive: 1, createdAt: -1 });
ServiceSchema.index({ provider: 1, isActive: 1 });
ServiceSchema.index({ isActive: 1, createdAt: -1 });

// Always rebuild the model in development so schema changes take effect after hot reload
if (mongoose.models.Service) {
  Reflect.deleteProperty(mongoose.models, 'Service');
}
const Service: Model<IService> = mongoose.model<IService>('Service', ServiceSchema);
export default Service;
