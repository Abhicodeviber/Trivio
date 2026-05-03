import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  vendor: mongoose.Types.ObjectId;
  category: string;
  price: number;
  unit: string;
  images: string[];
  tags: string[];
  inStock: boolean;
  mobile: string;
  whatsapp: string;
  customFields: Record<string, unknown>;
}

const ProductSchema = new Schema<IProduct>({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  vendor:      { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  category:    { type: String, default: '', trim: true },
  price:       { type: Number, required: true },
  unit:        { type: String, enum: ['kg', 'piece', 'dozen', 'litre', 'pack', 'other'], default: 'piece' },
  images:      { type: [String], default: [] },
  tags:        { type: [String], default: [] },
  inStock:     { type: Boolean, default: true },
  mobile:      { type: String, default: '' },
  whatsapp:    { type: String, default: '' },
  customFields:{ type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, inStock: 1, createdAt: -1 });
ProductSchema.index({ vendor: 1, inStock: 1 });
ProductSchema.index({ inStock: 1, createdAt: -1 });

if (mongoose.models.Product) {
  Reflect.deleteProperty(mongoose.models, 'Product');
}

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
