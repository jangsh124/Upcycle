// Premium 이미지 URL 생성
export function getPremiumImageUrl(productId, imageName, userSubscription, isLoggedIn) {
  const baseUrl = process.env.REACT_APP_API_URL || '';
  
  // Premium/VIP 구독자이고 로그인된 경우 원본 이미지
  if (isLoggedIn && userSubscription && 
      (userSubscription.tier === 'premium' || userSubscription.tier === 'vip') && 
      userSubscription.isActive) {
    return `${baseUrl}/api/premium-images/${productId}/${imageName}`;
  }
  
  // 그 외의 경우 모자이크 이미지
  return `${baseUrl}/api/premium-images/mosaic/${productId}/${imageName}`;
}

// Premium 상품 접근 권한 확인
export function canViewPremiumContent(userSubscription, isLoggedIn) {
  return isLoggedIn && 
         userSubscription && 
         (userSubscription.tier === 'premium' || userSubscription.tier === 'vip') && 
         userSubscription.isActive;
}

// Premium 상품 필터링
export function filterPremiumProducts(products, userSubscription, isLoggedIn) {
  const canViewPremium = canViewPremiumContent(userSubscription, isLoggedIn);
  
  return products.map(product => {
    const isPremium = product.tier === 'premium' || product.tier === 'vip';
    
    return {
      ...product,
      canView: !isPremium || canViewPremium,
      isPremium,
      // Premium 상품이고 접근 권한이 없으면 모자이크 이미지 사용
      images: isPremium && !canViewPremium 
        ? product.images.map(img => `/api/premium-images/mosaic/${product._id}/${img.split('/').pop()}`)
        : product.images
    };
  });
}

