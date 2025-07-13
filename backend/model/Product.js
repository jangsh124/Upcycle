const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  description:     String,
  price:           { type: Number, required: true },
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
