const mongoose = require('mongoose');
const User = require('./model/User');
const Product = require('./model/Product');

mongoose.connect('mongodb://localhost:27017/auth-app')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // 1. premiumuser@gmail.com 사용자 찾기
      const user = await User.findOne({email: 'premiumuser@gmail.com'});
      if (!user) {
        console.log('User premiumuser@gmail.com not found');
        return;
      }
      
      console.log('Found user:', user.email);
      console.log('Current subscription:', user.subscription);
      
      // 2. 사용자의 구독을 프리미엄으로 업데이트
      user.subscription = {
        tier: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        isActive: true
      };
      
      await user.save();
      console.log('Updated user subscription to premium');
      
      // 3. 이 사용자가 올린 모든 상품을 프리미엄으로 업그레이드
      const result = await Product.updateMany(
        {'sellerId.email': 'premiumuser@gmail.com'},
        {tier: 'premium'}
      );
      
      console.log(`Updated ${result.modifiedCount} products to premium tier`);
      
      // 4. 업데이트된 상품들 확인
      const updatedProducts = await Product.find({'sellerId.email': 'premiumuser@gmail.com'});
      console.log('\nUpdated products:');
      updatedProducts.forEach(p => {
        console.log(`- ${p.title}: ${p.tier}`);
      });
      
      // 5. 모든 프리미엄 상품 확인
      const allPremiumProducts = await Product.find({tier: 'premium'});
      console.log(`\nTotal premium products: ${allPremiumProducts.length}`);
      allPremiumProducts.forEach(p => {
        console.log(`- ${p.title} (${p.sellerId?.email || 'unknown'}): ${p.tier}`);
      });
      
    } catch (error) {
      console.error('Error:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => console.error('Connection error:', err));
