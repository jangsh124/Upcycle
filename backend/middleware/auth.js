const jwt = require('jsonwebtoken');
const User = require('../model/User');

const authMiddleware = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[auth] No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 콘솔 로그 추가
    console.log('[auth] decoded:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.warn('[auth] User not found:', decoded.id);
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      console.warn('[auth] tokenVersion mismatch:', user.tokenVersion, decoded.tokenVersion);
      return res.status(401).json({ error: '세션이 만료되었습니다. 다시 로그인 해주세요.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[auth] Invalid token:', err.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
