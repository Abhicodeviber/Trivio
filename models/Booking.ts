import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBooking extends Document {
  service: Types.ObjectId;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  totalAmount: number;
  notes?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

BookingSchema.index({ customer: 1 });
BookingSchema.index({ provider: 1 });
BookingSchema.index({ status: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking ?? mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
