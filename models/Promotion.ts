import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  link: string;
  linkText: string;
  createdByRole: 'admin' | 'vendor';
  vendorId?: mongoose.Types.ObjectId;
  isActive: boolean;
  order: number;
  expiresAt?: Date;
}

const PromotionSchema = new Schema<IPromotion>({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '', trim: true },
  mediaType:     { type: String, enum: ['image', 'video'], default: 'image' },
  mediaUrl:      { type: String, default: '' },
  link:          { type: String, default: '/' },
  linkText:      { type: String, default: 'Learn More', trim: true },
  createdByRole: { type: String, enum: ['admin', 'vendor'], required: true },
  vendorId:      { type: Schema.Types.ObjectId, ref: 'Vendor', default: null },
  isActive:      { type: Boolean, default: true },
  order:         { type: Number, default: 0 },
  expiresAt:     { type: Date, default: null },
}, { timestamps: true });

PromotionSchema.index({ isActive: 1, order: 1, createdAt: -1 });
PromotionSchema.index({ vendorId: 1 });

if (mongoose.models.Promotion) {
  Reflect.deleteProperty(mongoose.models, 'Promotion');
}

const Promotion: Model<IPromotion> = mongoose.model<IPromotion>('Promotion', PromotionSchema);
export default Promotion;
