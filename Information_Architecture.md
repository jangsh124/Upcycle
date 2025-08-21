# 📱 디지털 갤러리 Information Architecture

## 📋 목차
- [🏗️ 사이트 구조](#-사이트-구조)
- [👥 사용자 플로우](#-사용자-플로우)
- [💾 데이터 구조](#-데이터-구조)
- [🔗 API 엔드포인트](#-api-엔드포인트)
- [🎨 UI/UX 구조](#-uiux-구조)
- [🔐 보안 및 인증](#-보안-및-인증)
- [📁 파일 구조](#-파일-구조)
- [📝 변경 이력](#-변경-이력)

---

## 🏗️ 사이트 구조

### 페이지 구조표

| 페이지명 | URL | 설명 | 연결 페이지 | 권한 |
|---------|-----|------|------------|------|
| 홈 | `/` | 메인 페이지 | 갤러리, 로그인, 회원가입 | 모든 사용자 |
| 갤러리 | `/products` | 상품 목록 | 상품 상세, 홈 | 모든 사용자 |
| 로그인 | `/login` | 인증 페이지 | 홈, 회원가입 | 비로그인 사용자 |
| 회원가입 | `/signup` | 회원 등록 | 홈, 로그인 | 비로그인 사용자 |
| 상품 상세 | `/products/:id` | 개별 상품 정보 | 구매 페이지, 갤러리 | 모든 사용자 |
| 구매 페이지 | `/products/:id/payment` | 결제 페이지 | 구매 완료, 상품 상세 | 로그인 사용자 |
| 구독 페이지 | `/subscription` | 구독 플랜 선택 | 구독 결제, 홈 | 로그인 사용자 |
| 마이페이지 | `/mypage` | 사용자 대시보드 | 내 상품, 프로필 설정 | 로그인 사용자 |
| 내 상품 | `/mypage/products` | 내가 등록한 상품 | 상품 수정, 상품 등록 | 로그인 사용자 |
| 상품 등록 | `/product-form` | 새 상품 등록 | 내 상품, 갤러리 | 로그인 사용자 |

### 사이트맵
```
📱 디지털 갤러리
├── 🏠 홈 (/)
├── 🖼️ 갤러리 (/products)
│   ├── 전체 작품
│   ├── 프리미엄 작품 (반투명 + 오버레이)
│   └── 검색 결과
├── 👤 사용자
│   ├── 로그인 (/login)
│   ├── 회원가입 (/signup)
│   └── 마이페이지 (/mypage)
├── 🛒 거래
│   ├── 상품 상세 (/products/:id)
│   └── 구매 (/products/:id/payment)
└── 💎 구독 (/subscription)
```

---

## 👥 사용자 플로우

### 🔐 신규 사용자 플로우
```
1. 홈페이지 접속 (/)
   ↓
2. "가입" 버튼 클릭
   ↓
3. 회원가입 페이지 (/signup)
   - 이메일, 비밀번호, 이름 입력
   - 유효성 검사
   ↓
4. 회원가입 완료
   - 데이터베이스에 사용자 정보 저장
   - JWT 토큰 생성
   ↓
5. 자동 로그인 → 홈페이지로 리다이렉트
```

### 🔑 기존 사용자 로그인 플로우
```
1. "로그인" 버튼 클릭
   ↓
2. 로그인 페이지 (/login)
   - 이메일, 비밀번호 입력
   ↓
3. 인증 확인
   - bcrypt로 비밀번호 검증
   - JWT 토큰 생성
   ↓
4. 로그인 성공
   - localStorage에 토큰 저장
   - 홈페이지로 리다이렉트
```

### 🛒 구매 플로우
```
1. 갤러리에서 상품 선택
   ↓
2. 상품 상세 페이지 (/products/:id)
   - 상품 정보 확인
   - "구매하기" 버튼 클릭
   ↓
3. 구매 페이지 (/products/:id/payment)
   - 수량 선택
   - 가격 확인
   - 결제 정보 입력
   ↓
4. 결제 처리
   - 구매 정보 데이터베이스 저장
   - 상품 상태 업데이트
   ↓
5. 구매 완료
   - 완료 페이지 표시
   - 마이페이지로 이동 가능
```

### 💎 구독 플로우
```
1. 프리미엄 상품 섹션에서 "구독하기" 클릭
   ↓
2. 구독 페이지 (/subscription)
   - 플랜 선택 (Premium/VIP)
   - 가격 및 혜택 확인
   ↓
3. 결제 정보 입력
   ↓
4. 구독 처리
   - 사용자 구독 정보 업데이트
   - 해당 사용자의 모든 상품을 프리미엄으로 변경
   ↓
5. 구독 완료
   - 프리미엄 혜택 즉시 적용
```

---

## 💾 데이터 구조

### 👤 사용자 스키마 (Users Collection)
```javascript
{
  _id: ObjectId,
  email: "deltajang@gmail.com",
  password: "해시된 비밀번호 (bcrypt)",
  name: "김주이",
  walletAddress: "지갑 주소",
  tokenVersion: 1, // JWT 무효화용
  subscription: {
    tier: "premium", // free, premium, vip
    startDate: "2025-08-15T00:00:00.000Z",
    endDate: "2025-09-15T00:00:00.000Z",
    isActive: true
  },
  createdAt: "2025-06-26T...",
  updatedAt: "2025-08-17T..."
}
```

### 🖼️ 상품 스키마 (Products Collection)
```javascript
{
  _id: ObjectId,
  title: "제목없음tv",
  description: "8월 17일 일요일",
  price: 10000000,
  tokenSupply: 30000,
  tokenPrice: 100,
  tokenCount: 10000,
  sharePercentage: 30,
  shareQuantity: 0,
  unitPrice: 100,
  status: "available", // available, sold, reserved
  images: ["파일명1.jpg", "파일명2.jpg"],
  mainImageIndex: 0,
  sellerId: {
    _id: ObjectId,
    email: "deltajang@gmail.com",
    name: "김주이"
  },
  tier: "premium", // free, premium, vip
  location: {
    sido: "대구광역시",
    gugun: "동구"
  },
  createdAt: "2025-08-17T22:36:00.554Z",
  updatedAt: "2025-08-17T22:36:00.554Z"
}
```

### 💰 구매 스키마 (Purchases Collection)
```javascript
{
  _id: ObjectId,
  productId: ObjectId, // Products 참조
  buyerId: ObjectId,   // Users 참조
  sellerId: ObjectId,  // Users 참조
  quantity: 1,
  totalPrice: 10000000,
  status: "completed", // pending, completed, cancelled
  paymentMethod: "card",
  purchaseDate: "2025-08-18T...",
  createdAt: "2025-08-18T...",
  updatedAt: "2025-08-18T..."
}
```

---

## 🔗 API 엔드포인트

### 인증 관련
| 메서드 | 엔드포인트 | 설명 | 요청 데이터 | 응답 |
|--------|-----------|------|------------|------|
| POST | `/api/auth/signup` | 회원가입 | email, password, name | 사용자 정보 |
| POST | `/api/auth/login` | 로그인 | email, password | JWT 토큰 |
| GET | `/api/user/me` | 사용자 정보 | Authorization 헤더 | 사용자 정보 |

### 상품 관련
| 메서드 | 엔드포인트 | 설명 | 요청 데이터 | 응답 |
|--------|-----------|------|------------|------|
| GET | `/api/products` | 상품 목록 조회 | query: sort, search | 상품 배열 |
| GET | `/api/products/:id` | 상품 상세 조회 | - | 상품 객체 |
| POST | `/api/products` | 상품 등록 | FormData | 생성된 상품 |
| PUT | `/api/products/:id` | 상품 수정 | FormData | 수정된 상품 |
| DELETE | `/api/products/:id` | 상품 삭제 | - | 삭제 결과 |

### 구매 관련
| 메서드 | 엔드포인트 | 설명 | 요청 데이터 | 응답 |
|--------|-----------|------|------------|------|
| POST | `/api/products/:id/purchase` | 구매 처리 | quantity, paymentInfo | 구매 결과 |
| GET | `/api/purchases` | 구매 내역 조회 | Authorization 헤더 | 구매 목록 |

### 구독 관련
| 메서드 | 엔드포인트 | 설명 | 요청 데이터 | 응답 |
|--------|-----------|------|------------|------|
| POST | `/api/subscription/purchase` | 구독 구매 | plan, paymentInfo | 구독 정보 |
| PATCH | `/api/subscription/cancel` | 구독 취소 | Authorization 헤더 | 취소 결과 |
| GET | `/api/subscription/info` | 구독 정보 | Authorization 헤더 | 구독 상태 |

---

## 🎨 UI/UX 구조

### 🏠 홈페이지 구조
```
📱 홈페이지 (/)
├── 헤더
│   ├── 로고 "디지털 갤러리"
│   ├── 네비게이션
│   └── 사용자 메뉴 (로그인/가입 또는 프로필)
├── 메인 콘텐츠
│   ├── 히어로 섹션
│   ├── 최신 작품 미리보기 (3개)
│   ├── 서비스 소개
│   └── CTA 버튼들
└── 푸터
    ├── 링크들
    └── 저작권 정보
```

### 🖼️ 갤러리 페이지 구조
```
📱 갤러리 (/products)
├── 헤더
│   ├── 검색바
│   ├── 정렬 옵션
│   └── 필터 버튼
├── 상품 섹션
│   ├── 일반 상품 그리드
│   └── 프리미엄 상품 섹션 (반투명 + 오버레이)
└── 페이지네이션
```

### 💎 프리미엄 상품 표시 방식
```
프리미엄 상품 카드
├── 기본 이미지 (60% 투명도)
├── PREMIUM 배지
├── 오버레이 (구독 유도)
│   ├── "Premium 구독하세요" 메시지
│   ├── "더 많은 프리미엄 작품을 만나보세요"
│   └── 버튼들 (회원가입, 구독하기)
└── 호버 시 투명도 증가 (80%)
```

---

## 🔐 보안 및 인증

### JWT 토큰 관리
- **생성**: 로그인 시 서버에서 생성
- **저장**: localStorage에 저장
- **검증**: 모든 API 요청 시 Authorization 헤더로 전송
- **무효화**: tokenVersion으로 관리

### 비밀번호 보안
- **해싱**: bcrypt로 비밀번호 해싱
- **검증**: 로그인 시 bcrypt.compare()로 검증

### 권한 관리
- **일반 사용자**: 상품 조회, 구매
- **판매자**: 상품 등록, 수정, 삭제
- **프리미엄 구독자**: 프리미엄 상품 접근

---

## 📁 파일 구조

### 백엔드 구조
```
backend/
├── server.js              # 메인 서버 파일
├── .env                   # 환경 변수
├── controllers/           # 컨트롤러
├── middleware/            # 미들웨어
├── model/                 # 데이터 모델
├── routes/                # API 라우트
├── services/              # 비즈니스 로직
├── utils/                 # 유틸리티
└── uploads/               # 업로드된 파일
```

### 프론트엔드 구조
```
frontend/
├── public/                # 정적 파일
├── src/
│   ├── components/        # React 컴포넌트
│   ├── pages/            # 페이지 컴포넌트
│   ├── utils/            # 유틸리티 함수
│   └── App.js            # 메인 앱 컴포넌트
└── package.json
```

### 환경 변수 (.env)
```
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=my_super_secret_key
EMAIL_USER=delta@peakoplatform.com
EMAIL_PASS=afskdwzmdvxavvou
FRONTEND_URL=http://localhost:3000
```

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 담당자 | 상태 |
|------|-----------|--------|------|
| 2025-08-18 | IA 문서 초기 작성 | - | 완료 |
| 2025-08-18 | 프리미엄 상품 오버레이 구현 | - | 완료 |
| 2025-08-18 | 구독 시스템 연동 | - | 완료 |
| 2025-08-18 | 사용자 인증 시스템 구현 | - | 완료 |

---

## 🚀 향후 개선 계획

### 단기 계획 (1-2주)
- [ ] 검색 기능 개선
- [ ] 필터링 시스템 강화
- [ ] 모바일 반응형 최적화

### 중기 계획 (1-2개월)
- [ ] 실시간 알림 시스템
- [ ] 소셜 로그인 추가
- [ ] 결제 시스템 연동

### 장기 계획 (3-6개월)
- [ ] AI 추천 시스템
- [ ] 블록체인 연동
- [ ] 다국어 지원

---

*이 문서는 디지털 갤러리 프로젝트의 Information Architecture를 정의합니다.*
