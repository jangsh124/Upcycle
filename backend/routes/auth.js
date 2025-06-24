
//파일을 불러오기
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    res.json({ message: 'User created', user: { id: newUser._id, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  res.json({
    message: 'Login successful',
    user: { id: user._id, email: user.email },
    token,
  });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// /me 엔드포인트
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
