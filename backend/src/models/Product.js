const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    brand: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    returnEligible: { type: Boolean, default: false },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);

