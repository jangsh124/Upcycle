// ── backend/model/Order.js ──
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // 메모리 주문과 매칭하기 위한 고유 ID
  orderId:          { type: String, required: true, unique: true },

  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  productId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type:             { type: String, enum: ['buy', 'sell'],    required: true },
  price:            { type: Number, required: true },
  quantity:         { type: Number, required: true },
  remainingQuantity:{ type: Number, required: true },
  status:           { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' },

  // 결제/정산 관련 메타데이터 (플랫폼 수수료 등)
  currency:         { type: String, default: 'KRW' },
  subtotal:         { type: Number, default: 0 },          // price * quantity
  platformFeeRate:  { type: Number, default: 0 },          // 예: 0.01 (1%)
  platformFee:      { type: Number, default: 0 },          // 올림, 최소 1원
  platformFeeVatRate:{ type: Number, default: 0 },         // 예: 0.1 (10%)
  platformFeeVat:   { type: Number, default: 0 },          // 올림
  totalAmount:      { type: Number, default: 0 }           // subtotal + fee + vat
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
