# 🏃 RUNCLUB by HCWS

A social workout tracking web application optimized for mobile use. Track your workouts, compete with friends, and crush your fitness goals together.

![RUNCLUB](https://img.shields.io/badge/RUNCLUB-by%20HCWS-ef4444?style=for-the-badge)

## ✨ Features

### 🏋️ Workout Tracking
- **4 Workout Categories**: Running, Strength Training, Walking, Sports
- **Smart Timer**: Real-time workout timer with pause/resume
- **Splits Tracking**: Record splits for running/walking with automatic pace calculation
- **Activity Logging**: Log sets, reps, weights for strength training
- **Calorie Tracking**: Manual entry or automatic estimation

### 👥 Social Features
- **Club Sessions**: Create or join group workout sessions
- **6-Character Codes**: Easy session sharing
- **Real-time Updates**: See what your friends are working on
- **Group Stats**: View everyone's progress in a session

### 📊 Stats & Progress
- **Daily Streaks**: Build consistency with streak tracking
- **Weekly Summaries**: Track your progress over time
- **Category Breakdown**: See how you spend your workout time
- **All-time Stats**: Total workouts, duration, distance, calories

### 🔐 Authentication
- **Google Sign-in**: Secure OAuth authentication
- **Personalized Dashboard**: Time-of-day greetings

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google OAuth credentials

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/runclub.git
   cd runclub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/runclub"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Using Docker Compose (Development)

```bash
# Start all services (app + PostgreSQL)
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push

# View logs
docker-compose logs -f app
```

### Using Docker Compose (Production with GHCR)

1. **Build and push to GHCR**
   The GitHub Action automatically builds and pushes on every push to `main`.

2. **Deploy on Portainer**
   Create a stack with `docker-compose.prod.yml` and set the environment variables.

### Manual Docker Build

```bash
# Build the image
docker build -t runclub .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e GOOGLE_CLIENT_ID="your-google-id" \
  -e GOOGLE_CLIENT_SECRET="your-google-secret" \
  runclub
```

## 🔧 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

## 📱 PWA Support

RUNCLUB is a Progressive Web App! Install it on your device:
- **iOS**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → Menu → Install App
- **Desktop**: Click the install button in the address bar

## 🗄️ Database Schema

Key models:
- **User**: User accounts (via NextAuth)
- **Workout**: Individual workout sessions
- **Split**: Running/walking splits with pace
- **Activity**: Strength/sports activities
- **ClubSession**: Group workout sessions
- **Streak**: Daily workout streaks
- **WeeklyStat**: Aggregated weekly statistics

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Google OAuth)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State**: Zustand
- **Deployment**: Docker + GHCR

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── workouts/     # Workout CRUD
│   │   └── club/         # Club session endpoints
│   ├── dashboard/        # Dashboard page
│   ├── workout/          # Workout pages
│   ├── club/             # Club pages
│   ├── stats/            # Stats page
│   └── profile/          # Profile page
├── components/            # React components
│   ├── ui/               # UI primitives
│   ├── dashboard/        # Dashboard components
│   ├── workout/          # Workout components
│   ├── club/             # Club components
│   ├── stats/            # Stats components
│   └── profile/          # Profile components
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript types
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ by HCWS
