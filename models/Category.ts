import mongoose, { Schema, Document, Model } from 'mongoose';

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'tags';

export interface IFieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];   // for select / radio
  unit?: string;        // displayed next to number inputs  (e.g. "km", "hrs")
  required?: boolean;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  fields: IFieldDef[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FieldDefSchema = new Schema<IFieldDef>(
  {
    name:        { type: String, required: true },
    label:       { type: String, required: true },
    type:        { type: String, enum: ['text','number','select','textarea','checkbox','radio','tags'], required: true },
    placeholder: { type: String },
    options:     [{ type: String }],
    unit:        { type: String },
    required:    { type: Boolean, default: false },
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon:        { type: String, required: true },
    description: { type: String },
    fields:      [FieldDefSchema],
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
