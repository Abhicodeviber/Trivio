import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxPromotions: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  order: number;
}

const PlanSchema = new Schema<IPlan>({
  name:           { type: String, required: true, trim: true },
  description:    { type: String, default: '', trim: true },
  price:          { type: Number, required: true, min: 0 },
  durationDays:   { type: Number, required: true, min: 1, default: 30 },
  maxPromotions:  { type: Number, required: true, min: 1, default: 1 },
  features:       [{ type: String }],
  isActive:       { type: Boolean, default: true },
  isPopular:      { type: Boolean, default: false },
  order:          { type: Number, default: 0 },
}, { timestamps: true });

PlanSchema.index({ isActive: 1, order: 1 });

if (mongoose.models.Plan) {
  Reflect.deleteProperty(mongoose.models, 'Plan');
}

const Plan: Model<IPlan> = mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
