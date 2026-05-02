import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  service: Types.ObjectId;
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// After a review is saved, update the service's average rating
ReviewSchema.post('save', async function () {
  const Review = this.constructor as Model<IReview>;
  const stats = await Review.aggregate([
    { $match: { service: this.service } },
    { $group: { _id: '$service', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    const Service = mongoose.model('Service');
    await Service.findByIdAndUpdate(this.service, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

ReviewSchema.index({ provider: 1, createdAt: -1 });
ReviewSchema.index({ service: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
