const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// 모자이크 이미지 생성
async function createMosaicImage(originalImagePath, outputPath, blockSize = 20) {
  try {
    // 원본 이미지 정보 가져오기
    const metadata = await sharp(originalImagePath).metadata();
    
    // 작은 블록으로 이미지 분할하여 모자이크 효과 생성
    const mosaicImage = await sharp(originalImagePath)
      .resize(metadata.width, metadata.height, { 
        kernel: sharp.kernel.nearest,
        fit: 'fill'
      })
      .blur(10) // 블러 효과 추가
      .modulate({
        brightness: 0.7, // 밝기 조정
        saturation: 0.5  // 채도 조정
      })
      .jpeg({ quality: 60 }); // 품질 낮춤
    
    // 모자이크 이미지 저장
    await mosaicImage.toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('모자이크 이미지 생성 실패:', error);
    throw error;
  }
}

// Premium 상품 이미지 처리
async function processPremiumImage(originalImagePath, productId, imageName) {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const mosaicDir = path.join(uploadsDir, 'mosaic');
    
    // 모자이크 디렉토리 생성
    await fs.mkdir(mosaicDir, { recursive: true });
    
    const mosaicFileName = `mosaic_${productId}_${imageName}`;
    const mosaicPath = path.join(mosaicDir, mosaicFileName);
    
    // 모자이크 이미지 생성
    await createMosaicImage(originalImagePath, mosaicPath);
    
    return `/uploads/mosaic/${mosaicFileName}`;
  } catch (error) {
    console.error('Premium 이미지 처리 실패:', error);
    throw error;
  }
}

module.exports = {
  createMosaicImage,
  processPremiumImage
};

