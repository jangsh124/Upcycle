const mongoose = require('mongoose');
const Order = require('./model/Order');
const Holding = require('./model/Holding');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/auth-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixOrderData() {
  try {
    console.log('🔍 주문 데이터를 확인하고 수정하는 중...');
    
    // 1. 모든 주문 조회
    const orders = await Order.find({}).sort({ createdAt: -1 });
    console.log(`📊 전체 주문 수: ${orders.length}`);
    
    if (orders.length === 0) {
      console.log('✅ 주문이 없습니다. holdings에서 주문 데이터를 생성합니다.');
      
      // holdings 데이터 확인
      const holdings = await Holding.find({}).populate('productId', 'title');
      console.log(`📊 holdings 수: ${holdings.length}`);
      
      if (holdings.length > 0) {
        // holdings 기반으로 주문 데이터 생성
        for (const holding of holdings) {
          const orderId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          const totalValue = holding.quantity * holding.averagePrice;
          
          console.log(`🔄 주문 생성: ${holding.productId?.title} - ${holding.quantity}개 x ${holding.averagePrice}원`);
          
          await Order.create({
            orderId,
            userId: holding.userId,
            productId: holding.productId._id,
            type: 'buy',
            price: holding.averagePrice,
            quantity: holding.quantity,
            remainingQuantity: 0, // 이미 체결됨
            status: 'filled', // 완료 상태
            currency: 'KRW',
            subtotal: totalValue,
            platformFeeRate: 0.01,
            platformFee: Math.max(1, Math.ceil(totalValue * 0.01)),
            platformFeeVatRate: 0.1,
            platformFeeVat: Math.ceil(Math.max(1, Math.ceil(totalValue * 0.01)) * 0.1),
            totalAmount: totalValue + Math.max(1, Math.ceil(totalValue * 0.01)) + Math.ceil(Math.max(1, Math.ceil(totalValue * 0.01)) * 0.1),
            createdAt: new Date('2025-08-12T10:06:00.000Z') // 8월 12일 오후 07:06
          });
          
          console.log(`✅ 주문 생성 완료: ${orderId}`);
        }
      }
    } else {
      // 기존 주문들의 상태를 수정
      console.log('\n📋 기존 주문 상태 수정:');
      for (const order of orders) {
        console.log(`🔄 주문 ${order.orderId}: ${order.status} → filled`);
        
        order.status = 'filled';
        order.remainingQuantity = 0;
        await order.save();
        
        console.log(`✅ 주문 ${order.orderId} 수정 완료`);
      }
    }
    
    // 최종 확인
    const finalOrders = await Order.find({}).sort({ createdAt: -1 });
    console.log('\n📈 최종 주문 상태:');
    finalOrders.forEach(order => {
      console.log(`  - 주문ID: ${order.orderId}`);
      console.log(`    상태: ${order.status}`);
      console.log(`    타입: ${order.type}`);
      console.log(`    수량: ${order.quantity}개`);
      console.log(`    가격: ${order.price}원`);
      console.log(`    생성일: ${order.createdAt}`);
      console.log('    ---');
    });
    
    console.log('🎉 주문 데이터 수정 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrderData();

