const mongoose = require('mongoose');
const Order = require('./model/Order');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/auth-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixProcessingOrders() {
  try {
    console.log('🔍 processing 상태인 주문들을 찾는 중...');
    
    // processing 상태인 주문들 조회
    const processingOrders = await Order.find({ status: 'processing' });
    
    console.log(`📊 processing 상태인 주문 수: ${processingOrders.length}`);
    
    if (processingOrders.length === 0) {
      console.log('✅ processing 상태인 주문이 없습니다.');
      return;
    }
    
    // 각 주문을 filled로 업데이트
    for (const order of processingOrders) {
      console.log(`🔄 주문 ${order.orderId} 상태 변경: processing → filled`);
      
      order.status = 'filled';
      order.remainingQuantity = 0;
      await order.save();
      
      console.log(`✅ 주문 ${order.orderId} 업데이트 완료`);
    }
    
    console.log('🎉 모든 processing 주문을 filled로 업데이트했습니다!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixProcessingOrders();

