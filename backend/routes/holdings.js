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

// 🆕 사용자 전체 보유 자산 조회
router.get('/', auth, async (req, res) => {
  console.log('🎯 holdings API 함수 실행됨!');
  try {
    const userId = req.user.id;
    console.log(`🔍 사용자 ${userId}의 보유 자산 조회 시작`);
    
    // 먼저 모든 holdings 조회 (디버깅용)
    const allHoldings = await HoldingModel.find({ userId }).lean();
    console.log(`📋 전체 holdings 수: ${allHoldings.length}`);
    allHoldings.forEach(holding => {
      console.log(`  - 전체: ${holding.productId} - 수량: ${holding.quantity}, 평균가: ${holding.averagePrice}`);
    });
    
    // quantity > 0인 holdings만 조회 (실제 보유 중인 자산만)
    const holdings = await HoldingModel.find({ 
      userId, 
      quantity: { $gt: 0 } // 0보다 큰 수량만
    })
      .populate('productId', 'title price images uploader')
      .lean();
    
    console.log(`📊 quantity > 0인 holdings 수: ${holdings.length}`);
    holdings.forEach(holding => {
      console.log(`  - ${holding.productId?.title}: ${holding.quantity}개, 평균가: ${holding.averagePrice}원 (내 작품: ${holding.productId?.uploader?.toString() === userId.toString()})`);
      console.log(`    📈 구매 금액 계산: ${holding.quantity} × ${holding.averagePrice} = ${holding.quantity * holding.averagePrice}원`);
    });
    
    const holdingsWithDetails = holdings.map(holding => {
      // 구매한 총 금액 (수량 × 평균 구매가)
      const totalPurchaseValue = holding.quantity * holding.averagePrice;
      // 현재 시장가 (수량 × 현재 가격)
      const currentMarketValue = holding.quantity * (holding.productId?.price || 0);
      const isMyProduct = holding.productId?.uploader?.toString() === userId.toString();
      
      console.log(`💰 계산: ${holding.productId?.title} - 수량: ${holding.quantity} × 평균가: ${holding.averagePrice} = 구매금액: ${totalPurchaseValue}원`);
      
      return {
        _id: holding._id,
        productId: holding.productId?._id,
        productTitle: holding.productId?.title,
        productPrice: holding.productId?.price,
        productImage: holding.productId?.images?.[0],
        quantity: holding.quantity,
        averagePrice: holding.averagePrice,
        totalPurchaseValue: totalPurchaseValue, // 구매한 총 금액
        currentMarketValue: currentMarketValue, // 현재 시장가
        isMyProduct: isMyProduct
      };
    });
    
    console.log(`✅ 최종 반환 holdings 수: ${holdingsWithDetails.length}`);
    // 모든 holdings를 반환 (내가 올린 작품을 구매한 경우도 포함)
    res.json(holdingsWithDetails);
  } catch (error) {
    console.error('❌ 전체 보유 자산 조회 실패:', error);
    res.status(500).json({ error: '전체 보유 자산 조회 실패' });
  }
});

module.exports = router; 