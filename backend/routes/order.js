const express = require('express');
const Order = require('../model/Order');
const Product = require('../model/Product');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// get order book for product
router.get('/book/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const buyOrders = await Order.find({ productId, type: 'buy', status: 'open' })
      .sort({ price: -1, createdAt: 1 });
    const sellOrders = await Order.find({ productId, type: 'sell', status: 'open' })
      .sort({ price: 1, createdAt: 1 });
    res.json({ buyOrders, sellOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// place new order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, type, price, quantity } = req.body;
    if (!productId || !type || !price || !quantity) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const order = new Order({
      userId: req.user.id,
      productId,
      type,
      price,
      quantity,
      remainingQuantity: quantity,
    });
    await order.save();

    await matchOrders(productId);

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// cancel order
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (order.status !== 'open') {
      return res.status(400).json({ error: 'Cannot cancel order' });
    }
    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function matchOrders(productId) {
  const buyOrders = await Order.find({ productId, type: 'buy', status: 'open' })
    .sort({ price: -1, createdAt: 1 });
  const sellOrders = await Order.find({ productId, type: 'sell', status: 'open' })
    .sort({ price: 1, createdAt: 1 });

  for (const buy of buyOrders) {
    for (const sell of sellOrders) {
      if (buy.remainingQuantity === 0) break;
      if (sell.remainingQuantity === 0) continue;
      if (buy.price < sell.price) break;

      const qty = Math.min(buy.remainingQuantity, sell.remainingQuantity);
      buy.remainingQuantity -= qty;
      sell.remainingQuantity -= qty;

      if (buy.remainingQuantity === 0) buy.status = 'filled';
      if (sell.remainingQuantity === 0) sell.status = 'filled';

      await sell.save();
    }
    await buy.save();
  }
}

module.exports = router;