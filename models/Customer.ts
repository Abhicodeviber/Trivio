import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICustomer extends Document {
  name: string;
  email: string;
  password: string;
  role: 'customer';
  avatar?: string;
  phone?: string;
  location?: string;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true, minlength: 6 },
    role:        { type: String, default: 'customer', immutable: true },
    avatar:      { type: String },
    phone:       { type: String },
    location:    { type: String },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CustomerSchema.pre('save', async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self = this as any;
  if (!self.isModified('password')) return;
  self.password = await bcrypt.hash(self.password as string, 12);
});

CustomerSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return bcrypt.compare(candidate, (this as any).password);
};

CustomerSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => { ret.password = undefined; return ret; },
});

const Customer: Model<ICustomer> =
  mongoose.models.Customer ?? mongoose.model<ICustomer>('Customer', CustomerSchema);
export default Customer;
