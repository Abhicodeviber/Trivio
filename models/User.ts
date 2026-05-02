import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, default: 'admin', immutable: true },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self = this as any;
  if (!self.isModified('password')) return;
  self.password = await bcrypt.hash(self.password as string, 12);
});

UserSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return bcrypt.compare(candidate, (this as any).password);
};

UserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => { ret.password = undefined; return ret; },
});

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
export default User;
