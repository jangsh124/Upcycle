const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  remainingQuantity: { type: Number, required: true },
  status: { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);