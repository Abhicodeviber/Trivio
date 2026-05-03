import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILead extends Document {
  service: Types.ObjectId;
  provider: Types.ObjectId;
  customer?: Types.ObjectId;  // set when viewer is a logged-in customer
  visitorId?: string;
  contactType: 'mobile' | 'whatsapp';
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    service:     { type: Schema.Types.ObjectId, ref: 'Service',  required: true },
    provider:    { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    customer:    { type: Schema.Types.ObjectId, ref: 'Customer' },
    visitorId:   { type: String },
    contactType: { type: String, enum: ['mobile', 'whatsapp'], required: true },
  },
  { timestamps: true }
);

LeadSchema.index({ service: 1, createdAt: -1 });
LeadSchema.index({ provider: 1, createdAt: -1 });

if (mongoose.models.Lead) {
  Reflect.deleteProperty(mongoose.models, 'Lead');
}
const Lead: Model<ILead> = mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
