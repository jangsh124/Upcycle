// ── backend/services/orderBook.js ──
const OrderModel = require('../model/Order');
const HoldingModel = require('../model/Holding');
const ProductModel = require('../model/Product');

class OrderBook {
  constructor() {
    this.books = {}; // productId → { bids: [], asks: [] }
  }

  _initBook(productId) {
    if (!this.books[productId]) {
      this.books[productId] = { bids: [], asks: [] };
    }
    return this.books[productId];
  }

  // ① 주문 추가: 매칭 로직까지 async/await 처리
  async addOrder({ productId, side, price, quantity, orderId, userId }) {
    console.log(`📝 주문 추가: ${side} ${price}원 x ${quantity}개 (주문ID: ${orderId})`);
    
    const { bids, asks } = this._initBook(productId);
    
    // 매수 주문인 경우 즉시 매도 물량과 체결
    if (side === 'buy') {
      console.log(`🔄 매수 주문: 즉시 매도 물량과 체결 시도`);
      
      // 매도 물량이 없으면 기본 매도 호가 생성
      if (asks.length === 0) {
        console.log(`📝 기본 매도 호가 생성 중...`);
        try {
          const product = await ProductModel.findById(productId);
          if (product && product.sharePercentage > 0) {
            const totalSaleAmount = product.price * (product.sharePercentage / 100);
            const unitCount = Math.round(product.sharePercentage * 1000); // 0.001% 단위
            const unitPrice = unitCount > 0 ? Math.round(totalSaleAmount / unitCount) : 0;
            
            if (unitPrice > 0 && unitCount > 0) {
              // 기본 매도 호가 생성
              const defaultAskOrder = {
                price: unitPrice,
                quantity: unitCount,
                filled: 0,
                orderId: `default_${productId}`,
                timestamp: Date.now(),
                side: 'sell'
              };
              
              asks.push(defaultAskOrder);
              console.log(`📝 기본 매도 호가 생성: ${unitPrice}원 x ${unitCount}개`);
            }
          }
        } catch (error) {
          console.error(`❌ 기본 매도 호가 생성 실패: ${error.message}`);
          return [];
        }
      }
      
      // 🆕 매수 가격을 최저 매도 가격으로 자동 설정
      const lowestAskPrice = Math.min(...asks.map(ask => ask.price));
      console.log(`🔄 매수 가격을 최저 매도 가격(${lowestAskPrice}원)으로 자동 설정`);
      
      // 매수 가격을 최저 매도 가격으로 강제 설정
      price = lowestAskPrice;
      
      // 매수 주문을 메모리북에 추가
      const buyOrder = { 
        price, 
        quantity, 
        filled: 0, 
        orderId, 
        timestamp: Date.now(),
        side: 'buy'
      };
      bids.push(buyOrder);
      
      // 즉시 체결 로직
      const matches = await this.executeImmediateBuy(productId, price, quantity, orderId, userId);
      return matches;
    } else {
      // 매도 주문은 기존 로직 유지
      const list = asks;
      
      // 새 주문 추가
      const newOrder = { 
        price, 
        quantity, 
        filled: 0, 
        orderId, 
        timestamp: Date.now(),
        side 
      };
      list.push(newOrder);
      
      console.log(`✅ 매도 주문 추가 완료: ${price}원 x ${quantity}개`);
      
      // 체결 시도
      const matches = await this.matchOrders(productId);
      return matches;
    }
  }

  // 🆕 즉시 매수 체결 로직
  async executeImmediateBuy(productId, buyPrice, buyQuantity, buyOrderId, userId) {
    const { asks } = this._initBook(productId);
    const matches = [];
    let remainingBuyQuantity = buyQuantity;
    
    console.log(`🔄 즉시 매수 체결 시작: ${buyPrice}원 x ${buyQuantity}개`);
    
    // 매도 물량을 가격 순으로 정렬 (낮은 가격부터)
    const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
    
    for (const ask of sortedAsks) {
      if (remainingBuyQuantity <= 0) break;
      
      const availableQuantity = ask.quantity - ask.filled;
      if (availableQuantity <= 0) continue;
      
      const execQuantity = Math.min(remainingBuyQuantity, availableQuantity);
      const execPrice = ask.price; // 매도가 기준으로 체결
      
      console.log(`💥 즉시 체결: ${execPrice}원 x ${execQuantity}개 (매수: ${buyOrderId}, 매도: ${ask.orderId})`);
      
      // 체결 내역 저장
      matches.push({
        price: execPrice,
        quantity: execQuantity,
        buyOrderId: buyOrderId,
        sellOrderId: ask.orderId,
        timestamp: Date.now()
      });
      
      // 매도 물량 업데이트
      ask.filled += execQuantity;
      remainingBuyQuantity -= execQuantity;
      
      // DB 업데이트
      try {
        await OrderModel.findOneAndUpdate(
          { orderId: ask.orderId },
          {
            $inc: { remainingQuantity: -execQuantity },
            $set: { status: ask.filled >= ask.quantity ? 'filled' : 'partial' }
          }
        );
        
        // 🆕 직접 holdings 업데이트 (매수자 정보 사용)
        if (userId) {
          console.log(`🔄 매수자 holdings 업데이트: ${userId} -> ${execQuantity}개`);
          await this.updateUserHolding(userId, productId, execQuantity, execPrice, 'buy');
        } else {
          console.error(`❌ 매수자 정보가 없음: ${buyOrderId}`);
        }
      } catch (error) {
        console.error(`❌ DB 업데이트 실패: ${error.message}`);
      }
    }
    
    // 매수 주문 DB 저장 (체결된 수량만큼)
    const filledQuantity = buyQuantity - remainingBuyQuantity;
    if (filledQuantity > 0) {
      try {
        // 매수자 정보를 가져오기 위해 주문 ID에서 추출
        const buyOrder = await OrderModel.findOne({ orderId: buyOrderId });
        const userId = buyOrder ? buyOrder.userId : null;
        
        if (!userId) {
          console.error(`❌ 매수자 정보를 찾을 수 없음: ${buyOrderId}`);
          return matches;
        }
        
        // 이미 존재하는 주문인지 확인
        const existingOrder = await OrderModel.findOne({ orderId: buyOrderId });
        if (!existingOrder) {
          await OrderModel.create({
            orderId: buyOrderId,
            userId,
            productId,
            type: 'buy',
            price: buyPrice,
            quantity: buyQuantity,
            remainingQuantity: remainingBuyQuantity,
            status: remainingBuyQuantity > 0 ? 'partial' : 'filled'
          });
          console.log(`✅ 매수 주문 DB 저장 완료: ${buyOrderId}`);
        }
      } catch (error) {
        console.error(`❌ 매수 주문 DB 저장 실패: ${error.message}`);
      }
    }
    
    console.log(`✅ 즉시 매수 체결 완료: ${matches.length}건 체결, 남은 수량: ${remainingBuyQuantity}개`);
    return matches;
  }

  // ② 매칭 로직: 체결 시 DB 남은 수량·상태 업데이트
  async matchOrders(productId) {
    const book = this.books[productId];
    if (!book) return [];

    const { bids, asks } = book;
    const matches = []; // 체결 내역 저장
    
    // 가격–시간 우선순위 정렬
    bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);

    console.log(`🔄 매칭 시작: 매수 ${bids.length}개, 매도 ${asks.length}개`);

    // 체결 루프
    while (bids.length && asks.length && bids[0].price >= asks[0].price) {
      const bid = bids[0];
      const ask = asks[0];
      const execQty = Math.min(bid.quantity - bid.filled, ask.quantity - ask.filled);
      const execPrice = ask.price; // 매도가 기준으로 체결

      console.log(`💥 체결: ${execPrice}원 x ${execQty}개 (매수: ${bid.orderId}, 매도: ${ask.orderId})`);

      // 체결 내역 저장
      matches.push({
        price: execPrice,
        quantity: execQty,
        buyOrderId: bid.orderId,
        sellOrderId: ask.orderId,
        timestamp: Date.now()
      });

      // 메모리북 상태 업데이트
      bid.filled += execQty;
      ask.filled += execQty;

      // DB 업데이트: 남은 수량 차감, 상태 변경
      try {
        await OrderModel.findOneAndUpdate(
          { orderId: bid.orderId },
          {
            $inc: { remainingQuantity: -execQty },
            $set: { status: bid.filled >= bid.quantity ? 'filled' : 'partial' }
          }
        );
        await OrderModel.findOneAndUpdate(
          { orderId: ask.orderId },
          {
            $inc: { remainingQuantity: -execQty },
            $set: { status: ask.filled >= ask.quantity ? 'filled' : 'partial' }
          }
        );
        
        // 🆕 보유 지분 업데이트
        await this.updateHoldings(bid.orderId, ask.orderId, execQty, execPrice);
      } catch (error) {
        console.error(`❌ DB 업데이트 실패: ${error.message}`);
      }

      // 완전 체결된 주문은 메모리북에서 제거
      if (bid.filled >= bid.quantity) {
        console.log(`✅ 매수 주문 완전 체결: ${bid.orderId}`);
        bids.shift();
      }
      if (ask.filled >= ask.quantity) {
        console.log(`✅ 매도 주문 완전 체결: ${ask.orderId}`);
        asks.shift();
      }
    }

    console.log(`📊 매칭 완료: ${matches.length}건 체결`);
    return matches;
  }

  // ③ 주문장 조회: 남은 수량 포함해 반환
  async getBook(productId) {
    const { bids = [], asks = [] } = this.books[productId] || {};
    
    console.log(`📊 호가창 조회: 매수 ${bids.length}개, 매도 ${asks.length}개`);
    
    // 가격별로 수량 집계
    const bidMap = new Map();
    const askMap = new Map();
    
    // 🆕 매수 주문은 호가창에 표시하지 않음 (보유 지분으로만 표시)
    // bids.forEach(order => {
    //   const remaining = order.quantity - order.filled;
    //   if (remaining > 0) {
    //     bidMap.set(order.price, (bidMap.get(order.price) || 0) + remaining);
    //     console.log(`📈 매수 호가: ${order.price}원 x ${remaining}개 (주문ID: ${order.orderId})`);
    //   }
    // });
    
    // 매도 주문들 중 남은 수량이 있는 것만 집계 (메모리)
    asks.forEach(order => {
      const remaining = order.quantity - order.filled;
      if (remaining > 0) {
        askMap.set(order.price, (askMap.get(order.price) || 0) + remaining);
        console.log(`📉 매도 호가(메모리): ${order.price}원 x ${remaining}개 (주문ID: ${order.orderId})`);
      }
    });

    // 🆕 서버 재시작 등으로 메모리가 비었을 수 있으니 DB의 미체결 매도 주문을 합산
    try {
      const dbOpenSells = await OrderModel.find({
        productId,
        type: 'sell',
        remainingQuantity: { $gt: 0 }
      }).lean();
      for (const s of dbOpenSells) {
        const remaining = s.remainingQuantity;
        if (remaining > 0) {
          // 메모리북에 복원 (없을 때만)
          const existsInMemory = asks.some(a => a.orderId === s.orderId);
          if (!existsInMemory) {
            // 호가 집계에도 중복 없이 추가
            askMap.set(s.price, (askMap.get(s.price) || 0) + remaining);
            console.log(`📉 매도 호가(DB): ${s.price}원 x ${remaining}개 (주문ID: ${s.orderId})`);
            asks.push({
              price: s.price,
              quantity: s.quantity,
              filled: s.quantity - remaining,
              orderId: s.orderId,
              timestamp: new Date(s.createdAt || Date.now()).getTime(),
              side: 'sell'
            });
          } else {
            // 이미 메모리에 반영되어 있으므로 호가 집계에 중복 추가하지 않음
            console.log(`⏭️  중복 방지: 메모리에 존재하는 DB주문 ${s.orderId}는 집계 추가 생략`);
          }
        }
      }
    } catch (e) {
      console.error(`❌ DB 매도 주문 집계 실패: ${e.message}`);
    }
    
    // 기본 매도 호가(발행 잔량)는 항상 병행 표시: 사용자 매도와 함께 공존
    try {
      const product = await ProductModel.findById(productId);
      if (product && product.sharePercentage > 0) {
        const totalSaleAmount = product.price * (product.sharePercentage / 100);
        const totalUnitCount = Math.round(product.sharePercentage * 1000); // 0.001% 단위
        const unitPrice = totalUnitCount > 0 ? Math.round(totalSaleAmount / totalUnitCount) : 0;

        if (unitPrice > 0 && totalUnitCount > 0) {
          // 누적 매수 수량 조회(보유량 합계)
          let soldQuantity = 0;
          try {
            const totalHoldings = await HoldingModel.find({ productId: productId });
            soldQuantity = totalHoldings.reduce((sum, h) => sum + h.quantity, 0);
            console.log(`📊 누적 매수 수량: ${soldQuantity}개`);
          } catch (dbError) {
            console.error(`❌ 매수 수량 조회 실패: ${dbError.message}`);
            const existingDefaultAsk = this.books[productId]?.asks?.find(a => a.orderId === `default_${productId}`);
            if (existingDefaultAsk) soldQuantity = existingDefaultAsk.filled;
          }

          const remainingQuantity = Math.max(0, totalUnitCount - soldQuantity);

          if (remainingQuantity > 0) {
            // 메모리에 기본 호가가 없으면 복원
            const hasDefaultInMemory = (this.books[productId]?.asks || []).some(a => a.orderId === `default_${productId}`);
            if (!hasDefaultInMemory) {
              if (!this.books[productId]) this.books[productId] = { bids: [], asks: [] };
              this.books[productId].asks.push({
                price: unitPrice,
                quantity: totalUnitCount,
                filled: soldQuantity,
                orderId: `default_${productId}`,
                timestamp: Date.now(),
                side: 'sell'
              });
            }

            // 집계에 기본 잔량을 중복 없이 병합
            // 현재 askMap에는 메모리의 기본 주문이 있었다면 이미 "메모리 잔량"이 포함되어 있음
            const defaultInMemory = (this.books[productId]?.asks || []).find(a => a.orderId === `default_${productId}`);
            const memoryDefaultRemaining = defaultInMemory ? Math.max(0, defaultInMemory.quantity - defaultInMemory.filled) : 0;
            const alreadyCountedAtPrice = askMap.get(unitPrice) || 0;
            // 중복을 피하기 위해 메모리 기본잔량으로 이미 반영된 부분을 제외한 델타만 추가
            const delta = Math.max(0, remainingQuantity - Math.min(memoryDefaultRemaining, alreadyCountedAtPrice));
            if (delta > 0) {
              askMap.set(unitPrice, alreadyCountedAtPrice + delta);
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ 기본 매도 호가 병합 실패: ${error.message}`);
    }
    
    const result = {
      bids: Array.from(bidMap.entries())
        .sort(([a], [b]) => b - a) // 매수는 높은 가격부터
        .map(([price, quantity]) => ({ price, quantity })),
      asks: Array.from(askMap.entries())
        .sort(([a], [b]) => a - b) // 매도는 낮은 가격부터
        .map(([price, quantity]) => ({ price, quantity }))
    };
    
    console.log(`✅ 호가창 결과: 매수 ${result.bids.length}개, 매도 ${result.asks.length}개`);
    return result;
  }

  // 🆕 보유 지분 업데이트
  async updateHoldings(buyOrderId, sellOrderId, quantity, price) {
    try {
      // 매수/매도 주문 정보 조회
      const buyOrder = await OrderModel.findOne({ orderId: buyOrderId });
      const sellOrder = await OrderModel.findOne({ orderId: sellOrderId });
      
      if (!buyOrder || !sellOrder) {
        console.error('❌ 주문 정보를 찾을 수 없음');
        return;
      }
      
      // 매수자 보유 지분 증가
      await this.updateUserHolding(buyOrder.userId, buyOrder.productId, quantity, price, 'buy');
      
      // 매도자 보유 지분 감소
      await this.updateUserHolding(sellOrder.userId, sellOrder.productId, quantity, price, 'sell');
      
      console.log(`✅ 보유 지분 업데이트 완료: ${quantity}개 x ${price}원`);
    } catch (error) {
      console.error(`❌ 보유 지분 업데이트 실패: ${error.message}`);
    }
  }
  
  // 🆕 사용자 보유 지분 업데이트
  async updateUserHolding(userId, productId, quantity, price, type) {
    try {
      let holding = await HoldingModel.findOne({ userId, productId });
      
      if (!holding) {
        // 새로운 보유 지분 생성
        holding = new HoldingModel({
          userId,
          productId,
          quantity: type === 'buy' ? quantity : 0,
          averagePrice: type === 'buy' ? price : 0
        });
      } else {
        // 기존 보유 지분 업데이트
        if (type === 'buy') {
          // 매수: 수량 증가, 평균가 계산
          const totalValue = holding.quantity * holding.averagePrice + quantity * price;
          holding.quantity += quantity;
          holding.averagePrice = totalValue / holding.quantity;
        } else {
          // 매도: 수량 감소
          holding.quantity = Math.max(0, holding.quantity - quantity);
          if (holding.quantity === 0) {
            holding.averagePrice = 0;
          }
        }
      }
      
      await holding.save();
      console.log(`✅ ${type === 'buy' ? '매수' : '매도'}자 보유 지분 업데이트: ${quantity}개`);
    } catch (error) {
      console.error(`❌ 사용자 보유 지분 업데이트 실패: ${error.message}`);
    }
  }

  // ④ 주문 취소
  async cancelOrder(productId, orderId) {
    const book = this.books[productId];
    if (!book) return false;

    const { bids, asks } = book;
    
    // 매수 주문에서 찾기
    let orderIndex = bids.findIndex(o => o.orderId === orderId);
    let order = bids[orderIndex];
    
    if (orderIndex === -1) {
      // 매도 주문에서 찾기
      orderIndex = asks.findIndex(o => o.orderId === orderId);
      order = asks[orderIndex];
    }
    
    if (orderIndex === -1) {
      console.log(`❌ 주문을 찾을 수 없음: ${orderId}`);
      return false;
    }

    // 주문 제거
    const list = order.side === 'buy' ? bids : asks;
    list.splice(orderIndex, 1);
    
    console.log(`✅ 주문 취소 완료: ${orderId}`);
    return true;
  }
}

module.exports = new OrderBook();
