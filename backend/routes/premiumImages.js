const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const authMiddleware = require('../middleware/auth');
const Product = require('../model/Product');
const User = require('../model/User');
const { processPremiumImage } = require('../utils/imageProcessor');

const router = express.Router();

// Premium 이미지 접근 권한 확인
async function checkPremiumAccess(userId, productId) {
  try {
    // 상품 정보 확인
    const product = await Product.findById(productId);
    if (!product) return false;
    
    // Free 상품이면 접근 허용
    if (!product.tier || product.tier === 'free') return true;
    
    // Premium/VIP 상품인 경우 사용자 구독 확인
    if (!userId) return false;
    
    const user = await User.findById(userId);
    if (!user || !user.subscription) return false;
    
    return user.subscription.isActive && 
           (user.subscription.tier === 'premium' || user.subscription.tier === 'vip');
  } catch (error) {
    console.error('Premium 접근 권한 확인 실패:', error);
    return false;
  }
}

// Premium 이미지 제공 (권한 체크 후)
router.get('/:productId/:imageName', authMiddleware, async (req, res) => {
  try {
    const { productId, imageName } = req.params;
    const userId = req.user.id;
    
    console.log(`🔒 Premium 이미지 접근 요청: ${productId}/${imageName} by user ${userId}`);
    
    // 접근 권한 확인
    const hasAccess = await checkPremiumAccess(userId, productId);
    
    if (!hasAccess) {
      console.log(`❌ Premium 이미지 접근 거부: ${productId}/${imageName}`);
      return res.status(403).json({ 
        error: 'Premium 구독이 필요합니다',
        requiresSubscription: true 
      });
    }
    
    // 원본 이미지 경로
    const originalImagePath = path.join(__dirname, '../uploads', imageName);
    
    // 파일 존재 확인
    try {
      await fs.access(originalImagePath);
    } catch (error) {
      return res.status(404).json({ error: '이미지를 찾을 수 없습니다' });
    }
    
    console.log(`✅ Premium 이미지 접근 허용: ${productId}/${imageName}`);
    
    // 원본 이미지 제공
    res.sendFile(originalImagePath);
    
  } catch (error) {
    console.error('Premium 이미지 제공 실패:', error);
    res.status(500).json({ error: '이미지 제공에 실패했습니다' });
  }
});

// 모자이크 이미지 제공 (권한 없을 때)
router.get('/mosaic/:productId/:imageName', async (req, res) => {
  try {
    const { productId, imageName } = req.params;
    
    // 모자이크 이미지 경로
    const mosaicImagePath = path.join(__dirname, '../uploads/mosaic', `mosaic_${productId}_${imageName}`);
    
    // 모자이크 이미지가 없으면 생성
    try {
      await fs.access(mosaicImagePath);
    } catch (error) {
      // 모자이크 이미지 생성
      const originalImagePath = path.join(__dirname, '../uploads', imageName);
      await processPremiumImage(originalImagePath, productId, imageName);
    }
    
    // 모자이크 이미지 제공
    res.sendFile(mosaicImagePath);
    
  } catch (error) {
    console.error('모자이크 이미지 제공 실패:', error);
    res.status(500).json({ error: '모자이크 이미지 제공에 실패했습니다' });
  }
});

module.exports = router;

