const mongoose = require('mongoose');
const Holding = require('./model/Holding');
const Product = require('./model/Product');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/auth-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkHoldings() {
  try {
    console.log('🔍 holdings 데이터를 확인하는 중...');
    
    // 모든 holdings 조회
    const holdings = await Holding.find({}).populate('productId', 'title');
    
    console.log(`📊 전체 holdings 수: ${holdings.length}`);
    
    if (holdings.length === 0) {
      console.log('✅ holdings가 없습니다.');
      return;
    }
    
    console.log('\n📋 holdings 상세 정보:');
    holdings.forEach(holding => {
      console.log(`  - 사용자ID: ${holding.userId}`);
      console.log(`    상품: ${holding.productId?.title || 'Unknown'}`);
      console.log(`    수량: ${holding.quantity}개`);
      console.log(`    평균가: ${holding.averagePrice}원`);
      console.log(`    총 구매금액: ${holding.quantity * holding.averagePrice}원`);
      console.log('    ---');
    });
    
    // 사용자별 holdings 요약
    const userHoldings = {};
    holdings.forEach(holding => {
      const userId = holding.userId.toString();
      if (!userHoldings[userId]) {
        userHoldings[userId] = {
          totalQuantity: 0,
          totalValue: 0,
          products: []
        };
      }
      userHoldings[userId].totalQuantity += holding.quantity;
      userHoldings[userId].totalValue += holding.quantity * holding.averagePrice;
      userHoldings[userId].products.push({
        productTitle: holding.productId?.title || 'Unknown',
        quantity: holding.quantity,
        averagePrice: holding.averagePrice
      });
    });
    
    console.log('\n👤 사용자별 holdings 요약:');
    Object.entries(userHoldings).forEach(([userId, data]) => {
      console.log(`  - 사용자ID: ${userId}`);
      console.log(`    총 보유 수량: ${data.totalQuantity}개`);
      console.log(`    총 구매 금액: ${data.totalValue}원`);
      console.log(`    보유 상품 수: ${data.products.length}개`);
      data.products.forEach(product => {
        console.log(`      * ${product.productTitle}: ${product.quantity}개 (평균 ${product.averagePrice}원)`);
      });
      console.log('    ---');
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkHoldings();

