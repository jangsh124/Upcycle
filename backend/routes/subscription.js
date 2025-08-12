const express = require('express');
const User = require('../model/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 구독 구매
router.post('/purchase', authMiddleware, async (req, res) => {
  try {
    const { plan, paymentMethod, cardInfo } = req.body;
    
    // 플랜 유효성 검사
    if (!['premium', 'vip'].includes(plan)) {
      return res.status(400).json({ error: '유효하지 않은 구독 플랜입니다.' });
    }

    // 결제 정보 유효성 검사 (실제로는 결제 게이트웨이 연동 필요)
    if (!cardInfo || !cardInfo.number || !cardInfo.expiryMonth || !cardInfo.expiryYear || !cardInfo.cvc) {
      return res.status(400).json({ error: '카드 정보가 올바르지 않습니다.' });
    }

    // 여기서 실제 결제 처리를 해야 합니다 (예: Stripe, PayPal 등)
    // 현재는 시뮬레이션으로 처리
    console.log('💳 결제 처리 시뮬레이션:', {
      plan,
      paymentMethod,
      cardInfo: {
        ...cardInfo,
        number: cardInfo.number.replace(/\d(?=\d{4})/g, '*') // 카드번호 마스킹
      }
    });

    // 결제 성공 후 사용자 구독 정보 업데이트
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // 1개월 구독

    user.subscription = {
      tier: plan,
      startDate: now,
      endDate: endDate,
      isActive: true
    };

    await user.save();

    res.json({
      success: true,
      message: '구독이 성공적으로 완료되었습니다.',
      subscription: user.subscription
    });

  } catch (err) {
    console.error('구독 구매 오류:', err);
    res.status(500).json({ error: '구독 구매 중 오류가 발생했습니다.' });
  }
});

// 구독 해지
router.patch('/cancel', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 구독 해지 처리
    user.subscription = {
      tier: 'free',
      startDate: null,
      endDate: null,
      isActive: false
    };

    await user.save();

    res.json({
      success: true,
      message: '구독이 해지되었습니다.',
      subscription: user.subscription
    });

  } catch (err) {
    console.error('구독 해지 오류:', err);
    res.status(500).json({ error: '구독 해지 중 오류가 발생했습니다.' });
  }
});

// 구독 정보 조회
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      subscription: user.subscription || {
        tier: 'free',
        isActive: false,
        startDate: null,
        endDate: null
      }
    });

  } catch (err) {
    console.error('구독 정보 조회 오류:', err);
    res.status(500).json({ error: '구독 정보 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
