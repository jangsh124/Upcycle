const express = require('express');
const Vote = require('../model/Vote');
const Product = require('../model/Product');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// create a new proposal vote
router.post('/proposals', authMiddleware, async (req, res) => {
  try {
    const { productId, proposal } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const vote = new Vote({ productId, proposal });
    await vote.save();

    product.status = 'proposal';
    await product.save();

    res.json(vote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// tally votes and close proposal
router.post('/proposals/:id/tally', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await Vote.findById(id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const yes = (proposal.yes || []).length;
    const no = (proposal.no || []).length;

    if (proposal.open) {
      proposal.open = false;
      await proposal.save();

      const product = await Product.findById(proposal.productId);
      if (product) {
        product.status = yes > no ? 'sold' : 'available';
        await product.save();
      }
    }

    res.json({ yes, no });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;