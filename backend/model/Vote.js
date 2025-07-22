const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  proposal: { type: String, required: true },
  yes: [{ type: String }],
  no: [{ type: String }],
  open: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Vote', voteSchema);