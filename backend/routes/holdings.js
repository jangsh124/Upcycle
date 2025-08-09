// ── backend/routes/holdings.js ──
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const HoldingModel = require('../model/Holding');
const ProductModel = require('../model/Product');

// 🆕 사용자 보유 지분 조회
router.get('/user/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    const holding = await HoldingModel.findOne({ userId, productId });
    const product = await ProductModel.findById(productId);
    
    if (!holding) {
      return res.json({ 
        quantity: 0, 
        averagePrice: 0,
        ownershipPercentage: 0,
        totalShares: product ? product.sharePercentage * 1000 : 49000
      });
    }
    
    // 전체 지분 수량 (0.001% 단위)
    const totalShares = product ? product.sharePercentage * 1000 : 49000; // 임시로 49000 설정
    
    // 보유 지분율 계산 (소수점 3자리까지)
    const ownershipPercentage = totalShares > 0 ? 
      Math.round((holding.quantity / totalShares) * 100000) / 1000 : 0;
    
    res.json({
      quantity: holding.quantity,
      averagePrice: holding.averagePrice,
      ownershipPercentage: ownershipPercentage,
      totalShares: totalShares
    });
  } catch (error) {
    console.error('❌ 보유 지분 조회 실패:', error);
    res.status(500).json({ error: '보유 지분 조회 실패' });
  }
});

module.exports = router; 