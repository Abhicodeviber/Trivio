import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IProvider extends Document {
  name: string;
  email: string;
  password: string;
  role: 'provider';
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  rating: number;
  reviewCount: number;
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true, minlength: 6 },
    role:        { type: String, default: 'provider', immutable: true },
    avatar:      { type: String },
    phone:       { type: String },
    location:    { type: String },
    bio:         { type: String },
    skills:      [{ type: String }],
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isApproved:  { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProviderSchema.index({ location: 1 });
ProviderSchema.index({ skills: 1 });

ProviderSchema.pre('save', async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self = this as any;
  if (!self.isModified('password')) return;
  self.password = await bcrypt.hash(self.password as string, 12);
});

ProviderSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return bcrypt.compare(candidate, (this as any).password);
};

ProviderSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => { ret.password = undefined; return ret; },
});

const Provider: Model<IProvider> =
  mongoose.models.Provider ?? mongoose.model<IProvider>('Provider', ProviderSchema);
export default Provider;
