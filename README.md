# eRankUp 🎓

**AI-Driven Online Examination Platform** for Government Exam Preparation

A comprehensive, scalable platform featuring real-time analytics, adaptive testing, cross-platform support, and intelligent insights powered by AI.

---

## 🌟 Key Features

### For Students
- 📚 **Hierarchical Content Structure**: Exam → Subject → Chapter → Model → Questions
- 🎯 **Adaptive Testing**: Dynamic difficulty adjustment based on performance
- 📊 **Real-Time Analytics**: Topic-wise performance analysis with AI-powered insights
- 💰 **Flexible Pricing**: Free and premium content with coupon support
- 📱 **Cross-Platform**: Web dashboard and native mobile app
- 🏆 **Global Leaderboard**: Compete with peers nationwide
- 💬 **Live Support**: Real-time chat assistance

### For Admins
- 🎨 **Content Management**: Full CRUD for exams, subjects, chapters, and questions
- 📈 **Analytics Dashboard**: User engagement, revenue, and performance metrics
- 🤖 **AI-Powered Explanations**: Automated question explanations via Gemini AI
- 💳 **Payment Management**: Razorpay integration with coupon system
- 📧 **Marketing Tools**: Email campaigns and promotional coupons
- 🔍 **Quality Control**: Question flagging and review system

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   NestJS API    │────▶│   PostgreSQL    │
│   Dashboard     │     │   (REST/WS)     │     │   Database      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ├──────▶ Redis (Caching)
                               │
                               ├──────▶ Kafka (Events)
                               │
                               └──────▶ Razorpay (Payments)
                                         
┌─────────────────┐                    ┌─────────────────┐
│  Flutter Mobile │────────────────────▶│   Python AI     │
│      App        │                    │     Engine      │
└─────────────────┘                    └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Framer Motion
- **State**: Zustand
- **UI/UX**: Nebula Design System (glassmorphism, gradients)
- **Charts**: Recharts
- **Testing**: Playwright

### Mobile
- **Framework**: Flutter 3.x
- **State**: Provider
- **Storage**: SharedPreferences
- **Payments**: Razorpay Flutter SDK
- **Charts**: FL Chart
- **Notifications**: Awesome Notifications

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Caching**: Redis (ioredis)
- **Events**: Apache Kafka (KafkaJS)
- **Auth**: JWT + Passport
- **Payments**: Razorpay SDK
- **Real-time**: Socket.IO
- **AI**: Google Generative AI (Gemini)

### AI Engine
- **Language**: Python 3.x
- **Consumer**: Kafka Consumer
- **Analytics**: Custom performance analysis algorithms

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Services**: PostgreSQL, Redis, Kafka, Zookeeper

---

## 📁 Project Structure

```
eRankUp/
├── backend/              # NestJS API Server
│   ├── src/
│   │   ├── auth/        # Authentication & Authorization
│   │   ├── users/       # User management
│   │   ├── exams/       # Exam, Subject, Chapter, Model, Question
│   │   ├── test-session/# Test session management
│   │   ├── analytics/   # Performance analytics
│   │   ├── payments/    # Razorpay integration
│   │   ├── ai/          # AI explanations
│   │   ├── chat/        # Real-time support
│   │   ├── marketing/   # Campaigns & coupons
│   │   └── ...
│   └── package.json
│
├── frontend/            # Next.js Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/  # Student dashboard
│   │   │   ├── admin/      # Admin panel
│   │   │   ├── login/      # Authentication
│   │   │   └── signup/     # Registration
│   │   ├── components/     # Reusable components
│   │   ├── lib/           # API client, utilities
│   │   └── store/         # Zustand stores
│   └── package.json
│
├── mobile/              # Flutter Mobile App
│   ├── lib/
│   │   ├── screens/    # UI screens
│   │   ├── models/     # Data models
│   │   ├── services/   # API service, advanced services
│   │   ├── widgets/    # Reusable widgets
│   │   ├── theme/      # App theme
│   │   └── config/     # Environment configuration
│   └── pubspec.yaml
│
├── ai-engine/           # Python AI Analytics
│   ├── consumer.py     # Kafka consumer
│   ├── main.py         # AI logic
│   └── requirements.txt
│
├── docker-compose.yml   # Infrastructure setup
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+
- **Flutter** 3.0+
- **Docker** and Docker Compose
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/SimhaDadi/eRankUp.git
cd eRankUp
```

### 2. Start Infrastructure
```bash
docker-compose up -d
```
This starts PostgreSQL, Redis, Kafka, and Zookeeper.

### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run migrations (if any)
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```
Backend runs on **http://localhost:3001**

### 4. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start development server
npm run dev
```
Frontend runs on **http://localhost:3000**

### 5. AI Engine Setup
```bash
cd ai-engine
pip install -r requirements.txt

# Start Kafka consumer
python consumer.py
```

### 6. Mobile App Setup
```bash
cd mobile
flutter pub get

# For Android Emulator
flutter run

# For iOS Simulator
flutter run

# For specific environment
flutter run --dart-define=ENV=dev
```

---

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env`:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=erankup

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKER=localhost:9092

# Google AI
GOOGLE_AI_API_KEY=your_gemini_api_key
```

### Frontend Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Mobile Environment Configuration
Edit `mobile/lib/config/config.dart`:
```dart
static const Map<String, String> _apiBaseUrls = {
  'dev': 'http://10.0.2.2:3001',        // Android Emulator
  'staging': 'https://staging-api.erankup.com',
  'prod': 'https://api.erankup.com',
};
```

---

## 📱 Mobile App Environments

```bash
# Development (default)
flutter run

# Staging
flutter run --dart-define=ENV=staging

# Production
flutter run --dart-define=ENV=prod
```

---

## 🎯 Core Workflows

### Student Journey
1. **Signup/Login** → Create account or sign in
2. **Browse Exams** → Explore free and premium content
3. **Purchase** → Unlock premium exams (with coupon support)
4. **Take Test** → Timed test with real-time saving
5. **View Results** → Detailed analytics with AI insights
6. **Track Progress** → Performance trends and leaderboard

### Admin Journey
1. **Login** → Admin authentication
2. **Manage Content** → Create/edit exams, subjects, chapters, questions
3. **Monitor Analytics** → User engagement, revenue, performance
4. **Marketing** → Create coupons, email campaigns
5. **Quality Control** → Review flagged questions
6. **AI Tools** → Generate question explanations

---

## 🔑 Key Integrations

### Razorpay Payment Flow
1. User clicks "Purchase"
2. Optional coupon code entry
3. Backend creates Razorpay order
4. Frontend/Mobile opens Razorpay checkout
5. User completes payment
6. Webhook confirms payment
7. Access granted immediately

### AI Analytics Pipeline
1. User submits test
2. Backend creates Response entities (granular data)
3. Kafka event published
4. Python AI engine consumes event
5. Generates topic-wise insights
6. Stores recommendations
7. Frontend displays personalized analytics

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test           # Playwright tests
```

### Mobile Tests
```bash
cd mobile
flutter test           # Widget tests
```

---

## 📊 Recent Updates

### ✅ Latest Features (Jan 2026)
- **Razorpay Migration**: Replaced Stripe with Razorpay for India-specific payments
- **Coupon System**: Full discount code support on web and mobile
- **Mobile Signup**: Complete registration flow in Flutter app
- **Environment Config**: Production-ready API configuration
- **401 Auto-Logout**: Automatic session management
- **User Profile Storage**: Full offline profile access
- **Response Entity**: Granular analytics with per-question tracking

### 🔄 Migration Notes
- ✅ Stripe dependency removed from frontend
- ✅ All payment flows use Razorpay
- ✅ Coupon validation integrated
- ✅ Mobile app feature parity improved

---

## 🚢 Deployment

### Backend (Production)
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
npm run start
```

### Mobile (Release Build)
```bash
cd mobile
# Android
flutter build apk --release
flutter build appbundle --release

# iOS
flutter build ios --release
```

---

## 📈 Performance Optimizations

- ✅ Redis caching for leaderboards and exam data
- ✅ Database query optimization with proper indexing
- ✅ Lazy loading and pagination
- ✅ Image optimization and CDN integration
- ✅ Code splitting in Next.js
- ✅ Flutter performance best practices

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Razorpay signature verification
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (TypeORM)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Simha Dadi**
- GitHub: [@SimhaDadi](https://github.com/SimhaDadi)

---

## 🙏 Acknowledgments

- NestJS for the robust backend framework
- Next.js team for the amazing React framework
- Flutter team for cross-platform mobile development
- Google for Gemini AI API
- Razorpay for seamless payment integration

---

**Built with ❤️ for students preparing for government exams**
