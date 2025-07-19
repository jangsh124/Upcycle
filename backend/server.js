const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');      // 추가: 경로 모듈
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// 업로드 폴더를 정적 파일로 공개 (이미지 클라이언트 접근 가능)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 로그 출력 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// DB 연결 후 서버 시작
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas connected');

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// 라우터 불러오기
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const daoRoutes = require('./routes/dao');
const orderRoutes = require('./routes/order');

// 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dao', daoRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

const nodemailer = require('nodemailer');

app.get('/test-email', async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '테스트 이메일',
      text: '이 이메일은 서버에서 발송되었습니다.',
    });

    res.send('✅ 이메일 전송 성공!');
  } catch (err) {
    console.error('❌ 이메일 전송 실패:', err);
    res.status(500).send('이메일 전송 실패');
  }
});

startServer();
