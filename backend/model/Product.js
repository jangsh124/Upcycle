const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  description:     String,
  price:           { type: Number, required: true },
  tokenSupply:     { type: Number, default: 0 },
  tokenPrice:      { type: Number, default: 0 },
  tokenCount:      { type: Number, min: 50, max: 10000, default: 100 },
  sharePercentage: { type: Number, default: 0 },
  shareQuantity:   { type: Number, default: 0 },
  unitPrice:       { type: Number, default: 0 },
  status:          { type: String, enum: ['available', 'proposal', 'sold'], default: 'available' },
  images:          [String],
  mainImageIndex:  { type: Number, default: 0 },

  // 추가된 location 필드
  location: {
    sido:  { type: String, required: true },
    gugun: { type: String, required: true }
  },

  sellerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
