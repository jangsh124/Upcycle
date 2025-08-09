// ── backend/server.js ──
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// 라우터
const authRoutes    = require("./routes/auth");
const productRoutes = require("./routes/product");
const userRoutes    = require("./routes/user");
const daoRoutes     = require("./routes/dao");
const orderRoutes   = require("./routes/orderRoutes");
const holdingsRoutes = require("./routes/holdings");

const app = express();

// 1) CORS 설정: React dev 서버 허용
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// 2) JSON & static 파일 서빙
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3) 요청 로깅
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 4) 엔드포인트 등록
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dao", daoRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/holdings", holdingsRoutes);

// 5) 헬스체크 및 테스트 이메일
app.get("/", (req, res) => res.send("✅ Server is running!"));
app.get("/test-email", async (req, res) => {
  const nodemailer = require("nodemailer");
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "테스트 이메일",
      text: "이 이메일은 서버에서 발송되었습니다.",
    });
    res.send("✅ 이메일 전송 성공!");
  } catch (err) {
    console.error("❌ 이메일 전송 실패:", err);
    res.status(500).send("이메일 전송 실패");
  }
});

// 6) MongoDB 연결 & HTTP+Socket.io 서버 시작
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Express 앱을 HTTP 서버로 감싸고 Socket.io 초기화
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: "http://localhost:3000", credentials: true },
    });

    // ← 추가된 부분: io 인스턴스를 app에 저장
    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);
      // 나중에 매칭 로직에서:
      // req.app.get('io').emit("orderbook:update", { productId, ...book });
    });

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () =>
      console.log(`🚀 Server & Socket.io running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server start failed:", err);
    process.exit(1);
  }
}

startServer();
