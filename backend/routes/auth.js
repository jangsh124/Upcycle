const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

/* ----------------------------- 회원가입 ----------------------------- */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  // 비밀번호 정책 체크
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^+=-])[A-Za-z\d@$!%*#?&^+=-]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: '비밀번호는 최소 8자, 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    // tokenVersion 0으로 초기화
    newUser.tokenVersion = 0;
    await newUser.save();

    res.json({ message: 'User created', user: { id: newUser._id, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

/* ----------------------------- 로그인 ----------------------------- */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user._id, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ----------------------- 비밀번호 재설정 링크 요청 ----------------------- */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1시간
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '비밀번호 재설정 링크',
      html: `<p>비밀번호를 재설정하려면 아래 링크를 클릭하세요:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ message: '이메일을 확인하세요.' });
  } catch (err) {
    console.error('이메일 전송 실패:', err);
    res.status(500).json({ error: '이메일 전송에 실패했습니다.' });
  }
});

/* ----------------------------- 비밀번호 재설정 ----------------------------- */
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  // 비밀번호 정책 체크
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^+=-])[A-Za-z\d@$!%*#?&^+=-]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: '비밀번호는 최소 8자, 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
    });
  }
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: '유효하지 않거나 만료된 토큰입니다.' });

    // 비밀번호 변경 및 토큰 무효화
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1; // 기존 모든 토큰 무효화
    await user.save();

    res.json({ message: '비밀번호가 성공적으로 변경되었으며 로그아웃되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '비밀번호 재설정에 실패했습니다.' });
  }
});

/* ----------------------------- 내 정보 조회 ----------------------------- */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ----------------------------- 프로필 사진 업로드 ----------------------------- */
// multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/profiles/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/upload-profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 프로필 이미지 경로 저장
    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    res.json({ message: '프로필 사진이 업로드되었습니다.', imageUrl: user.profileImage });
  } catch (err) {
    console.error('업로드 에러:', err);
    res.status(500).json({ error: '프로필 업로드 실패' });
  }
});

module.exports = router;
