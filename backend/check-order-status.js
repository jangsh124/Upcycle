const mongoose = require('mongoose');
const Order = require('./model/Order');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/auth-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkOrderStatus() {
  try {
    console.log('🔍 모든 주문 상태를 확인하는 중...');
    
    // 모든 주문 조회
    const orders = await Order.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 전체 주문 수: ${orders.length}`);
    
    if (orders.length === 0) {
      console.log('✅ 주문이 없습니다.');
      return;
    }
    
    // 상태별로 그룹화
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    
    console.log('📈 주문 상태별 통계:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}개`);
    });
    
    console.log('\n📋 최근 주문 10개 상세 정보:');
    orders.slice(0, 10).forEach(order => {
      console.log(`  - 주문ID: ${order.orderId}`);
      console.log(`    상태: ${order.status}`);
      console.log(`    타입: ${order.type}`);
      console.log(`    수량: ${order.quantity}개`);
      console.log(`    남은수량: ${order.remainingQuantity}개`);
      console.log(`    가격: ${order.price}원`);
      console.log(`    생성일: ${order.createdAt}`);
      console.log('    ---');
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkOrderStatus();

