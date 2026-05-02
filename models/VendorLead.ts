import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IVendorLead extends Document {
  productId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerRole?: string;
  contactType: 'mobile' | 'whatsapp';
  ip: string;
}

const VendorLeadSchema = new Schema<IVendorLead>({
  productId:    { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId:     { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  customerId:   { type: Schema.Types.ObjectId, default: null },
  customerRole: { type: String, default: null },
  contactType:  { type: String, enum: ['mobile', 'whatsapp'], required: true },
  ip:           { type: String, default: '' },
}, { timestamps: true });

VendorLeadSchema.index({ vendorId: 1, createdAt: -1 });
VendorLeadSchema.index({ productId: 1 });

if (mongoose.models.VendorLead) {
  delete (mongoose.models as Record<string, unknown>).VendorLead;
}

const VendorLead: Model<IVendorLead> = mongoose.model<IVendorLead>('VendorLead', VendorLeadSchema);

export default VendorLead;
