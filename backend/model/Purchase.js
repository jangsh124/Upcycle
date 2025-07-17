
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
