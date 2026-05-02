import mongoose, { Document, Model, Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IVendor extends Document {
  shopName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  description: string;
  logo: string;
  categories: string[];
  isActive: boolean;
  isApproved: boolean;
  rating: number;
  reviewCount: number;
  comparePassword(candidate: string): Promise<boolean>;
}

const VendorSchema = new Schema<IVendor>({
  shopName:    { type: String, required: true, trim: true },
  ownerName:   { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true },
  phone:       { type: String, required: true, trim: true },
  whatsapp:    { type: String, default: '', trim: true },
  city:        { type: String, default: '', trim: true },
  address:     { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  logo:        { type: String, default: '' },
  categories:  { type: [String], default: [] },
  isActive:    { type: Boolean, default: true },
  isApproved:  { type: Boolean, default: true },
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

VendorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcryptjs.hash(this.password, 10);
});

VendorSchema.methods.comparePassword = function (candidate: string) {
  return bcryptjs.compare(candidate, this.password);
};

VendorSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

// Clear cached model so hot-reload picks up schema changes
if (mongoose.models.Vendor) {
  delete (mongoose.models as Record<string, unknown>).Vendor;
}

const Vendor: Model<IVendor> = mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;
