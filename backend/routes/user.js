const express = require('express');
const User = require('../model/User');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// 프로필 이미지 저장 경로 설정
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/'); // 폴더 반드시 존재해야 함
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const profileUpload = multer({ storage: profileStorage });

// 프로필 전체 수정 (이름, 소개, 이미지 포함)
router.patch(
  "/profile",
  authMiddleware,
  profileUpload.single("profileImage"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      const { name, bio } = req.body;

      if (name) user.name = name;
      if (bio) user.bio = bio;
      if (req.file) {
        user.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      await user.save();

      // 수정 후 응답도 user의 주요 정보만 깔끔하게 보내기
      res.json({
        success: true,
        user: {
          email: user.email,
          walletAddress: user.walletAddress,
          name: user.name,
          bio: user.bio,
          profileImage: user.profileImage,
          _id: user._id
        }
      });
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      res.status(500).json({ error: "프로필 수정 중 오류 발생" });
    }
  }
);

// 현재 로그인한 유저 정보 조회
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    // user의 주요 정보만 추려서 보내기 (이 구조로 프론트 setUserEmail 등 문제 X)
    res.json({
      email: user.email,
      walletAddress: user.walletAddress,
      name: user.name,
      bio: user.bio,
      profileImage: user.profileImage,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
