import mongoose, { Document, Model, Schema } from 'mongoose';

export type SubStatus = 'pending' | 'active' | 'expired' | 'failed';

export interface IVendorSubscription extends Document {
  vendorId: mongoose.Types.ObjectId;
  planId:   mongoose.Types.ObjectId;
  razorpayOrderId:   string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status:            SubStatus;
  maxPromotions:     number;
  promotionsUsed:    number;
  startsAt?:  Date;
  expiresAt?: Date;
  amount:     number;
}

const VendorSubscriptionSchema = new Schema<IVendorSubscription>({
  vendorId:           { type: Schema.Types.ObjectId, ref: 'Vendor',  required: true },
  planId:             { type: Schema.Types.ObjectId, ref: 'Plan',    required: true },
  razorpayOrderId:    { type: String, required: true, unique: true },
  razorpayPaymentId:  { type: String, default: '' },
  razorpaySignature:  { type: String, default: '' },
  status:             { type: String, enum: ['pending','active','expired','failed'], default: 'pending' },
  maxPromotions:      { type: Number, required: true },
  promotionsUsed:     { type: Number, default: 0 },
  startsAt:           { type: Date },
  expiresAt:          { type: Date },
  amount:             { type: Number, required: true },
}, { timestamps: true });

VendorSubscriptionSchema.index({ vendorId: 1, status: 1 });
VendorSubscriptionSchema.index({ razorpayOrderId: 1 });

if (mongoose.models.VendorSubscription) {
  Reflect.deleteProperty(mongoose.models, 'VendorSubscription');
}

const VendorSubscription: Model<IVendorSubscription> = mongoose.model<IVendorSubscription>('VendorSubscription', VendorSubscriptionSchema);
export default VendorSubscription;
