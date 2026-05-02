import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://localhost:27017/servehub';

// Admin lives in the 'users' collection
const UserSchema = new mongoose.Schema(
  {
    name:     String,
    email:    { type: String, unique: true, lowercase: true },
    password: String,
    role:     { type: String, default: 'admin' },
  },
  { timestamps: true }
);
const User = mongoose.models.User ?? mongoose.model('User', UserSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'abhi@gmail.com' });
  const hashed = await bcrypt.hash('123456', 12);

  if (existing) {
    existing.password = hashed;
    existing.role = 'admin';
    await existing.save();
    console.log('Admin updated.');
  } else {
    await User.create({ name: 'Abhi Admin', email: 'abhi@gmail.com', password: hashed, role: 'admin' });
    console.log('Admin created.');
  }

  console.log('  Collection : users');
  console.log('  Email      : abhi@gmail.com');
  console.log('  Password   : 123456');
  console.log('  Role       : admin');

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
