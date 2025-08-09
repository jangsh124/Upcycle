// ── backend/model/Holding.js ──
const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  averagePrice: {
    type: Number,
    required: true,
    default: 0
  }
}, { 
  timestamps: true,
  // userId와 productId의 조합이 유일해야 함
  indexes: [
    { unique: true, fields: ['userId', 'productId'] }
  ]
});

module.exports = mongoose.model('Holding', holdingSchema); 