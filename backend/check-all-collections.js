const mongoose = require('mongoose');

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/auth-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkAllCollections() {
  try {
    console.log('🔍 모든 컬렉션을 확인하는 중...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 전체 컬렉션 수: ${collections.length}`);
    
    for (const collection of collections) {
      console.log(`\n📋 컬렉션: ${collection.name}`);
      
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  문서 수: ${count}`);
      
      if (count > 0) {
        // 각 컬렉션의 샘플 데이터 확인
        const sample = await db.collection(collection.name).findOne();
        console.log(`  샘플 데이터:`, JSON.stringify(sample, null, 2));
      }
    }
    
    // 특별히 확인할 컬렉션들
    const importantCollections = ['orders', 'holdings', 'users', 'products'];
    
    console.log('\n🎯 중요 컬렉션 상세 확인:');
    for (const collName of importantCollections) {
      try {
        const count = await db.collection(collName).countDocuments();
        console.log(`  ${collName}: ${count}개 문서`);
        
        if (count > 0) {
          const docs = await db.collection(collName).find().limit(3).toArray();
          console.log(`    샘플:`, docs.map(doc => ({
            _id: doc._id,
            ...(doc.orderId && { orderId: doc.orderId }),
            ...(doc.status && { status: doc.status }),
            ...(doc.type && { type: doc.type }),
            ...(doc.quantity && { quantity: doc.quantity }),
            ...(doc.userId && { userId: doc.userId }),
            ...(doc.productId && { productId: doc.productId }),
            ...(doc.title && { title: doc.title }),
            ...(doc.email && { email: doc.email })
          })));
        }
      } catch (error) {
        console.log(`  ${collName}: 컬렉션 없음`);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAllCollections();

