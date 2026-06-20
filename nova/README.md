# 🏦 Nova Bank — Premium Digital Banking Solutions

Nova Bank is a premium digital banking platform built for Sri Lanka, combining a state-of-the-art **Dark Glassmorphism** user interface with powerful full-stack capabilities, real-time sync, and AI-powered financial advisory.

Designed to deliver a high-end, responsive visual experience, the platform incorporates neon purple and pink styling, smooth interactive animations, and structural depth.

---

## 🎨 Design Philosophy & Theme

- **Interactive Glassmorphism**: Cards and navigation sidebars feature frosted glass backdrops (`backdrop-filter: blur(30px)`), glowing SVG icons, and precise borders (`1px solid rgba(255,255,255,0.08)`) with subtle gradient fills.
- **Micro-Animations & Visual Depth**: Keyframe animated glowing background orbs (neon purple and magenta) float in the background to provide a sense of 3D parallax. Interactive buttons scale, glow, and change lighting on hover and click states.
- **Modern Typography**: Integrated **Outfit** font from Google Fonts for a clean, futuristic, and premium feel.
- **Responsive Layout**: Fluid grids and CSS media queries automatically scale the visual experience from desktop screens down to mobile devices.

---

## 🚀 Key Feature Highlights

1. **🏦 Bank Accounts Management**: Full CRUD operations for linked accounts, balance display cards, and account name customization.
2. **💳 Virtual Card Generator**: Generate custom virtual debit or credit cards with dynamic spend limits, instant toggle freeze/unfreeze, and interactive 3D card-flip animations.
3. **💸 Instant & Scheduled Transfers**: Perform real-time peer transfers, schedule recurring payments (daily, weekly, monthly), or utilize card payments.
4. **🐖 Savings Jars & Spare Change Round-Ups**:
   - Establish multiple savings goals with automated progress tracking.
   - Dynamic 3D glass savings jars filled with an animated golden liquid that rises proportional to target completion.
   - *Spare Change Round-Up*: Automatically round up card transactions to the nearest Rs. 50 or Rs. 100, sweeping the spare change into active jars.
5. **📈 Smart Spend (AI-Powered Analytics)**: Visual spending breakdown donut charts, budget limits per category (Food, Bills, Shopping, etc.), and real-time warnings when thresholds are crossed.
6. **🤖 Nova AI Chatbot**: A context-aware financial advisor chat bubble powered by Google Gemini API. It reads your current balances, transaction history, and budgets to answer direct financial questions.
7. **🧾 E-Statements**: Generate running balance ledger files with debit/credit color coding.
8. **🔔 Real-Time SSE Alerts**: Integrated live Server-Sent Events (SSE) notification panel withToast overlays for transfers, split requests, round-up activities, and budget violations.
9. **🤝 Social Bill Splitting**: Split any past transaction with a friend by searching their username, generating a real-time split request with instant approve/decline flows.
10. **🛡️ Admin Control Panel**: Dedicated dashboard for admin roles featuring platform-wide KPI stats, user directory management, raw log viewing, and override balance adjustment vaults.

---

## ⚙️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, CSS Modules + Traditional CSS variables.
- **Backend**: NestJS 10, TypeORM, Class Validator.
- **Database**: SQLite (local file-based database for zero configuration setup).
- **AI Engine**: Google Gemini API.
- **Real-Time Sync**: Server-Sent Events (SSE).
- **Auth**: JWT (JSON Web Tokens) + Bcrypt password hashing.
- **Mail**: Nodemailer (Real SMTP or local file-based mail inspector).
- **Storage**: AWS S3 integration for user avatars.

---

## 🔐 Seed Credentials

For quick local testing and evaluation, the following pre-registered seed credentials are available:

- **Customer A**:
  - **Username / Account**: `dilara`
  - **Password**: `password123`
- **Customer B**:
  - **Username / Account**: `kasun`
  - **Password**: `kasun`
- **Administrator**:
  - **Username**: `admin`
  - **Password**: `admin`

---

## 📂 Project Structure

```
nova-bank/
├── app/                          # Next.js Frontend
│   ├── (accounts)/               # Auth Layout (login, sign-up, reset-password)
│   ├── dashboard/                # Platform Dashboard
│   ├── bank-accounts/            # Account Management
│   ├── cards/                    # Virtual Cards Dashboard
│   ├── savings-jars/             # Gamified Savings & Jars
│   ├── bank-transfer/            # Peer Transfers & Bill Splits
│   ├── pay-bills/                # CEB/Dialog/SLT Utility Payments
│   ├── smart-spend/              # Budgets & Spending Charts
│   ├── e-statement/              # Statement Generator
│   └── profile/                  # Avatar & Account Settings
│
├── components/                   # Shared UI Components
│   ├── sidebar.tsx               # Navigation Sidebar
│   ├── ai-chat.tsx               # Floating AI Chatbot Bubble
│   └── notification-center.tsx   # SSE Notification Center
│
└── server/src/                   # NestJS Backend Modules
    ├── auth/                     # JWT Authentication & guards
    ├── transfer/                 # Transfer execution + spare change round-up
    ├── virtual-cards/            # Card generation & limits
    ├── savings-jars/             # savings goal logic
    ├── budgets/                  # budget categories & bounds
    ├── ai/                       # Google Gemini connector
    ├── notifications/            # SSE notifications stream
    └── scheduled-transfers/      # Cron-based payment automation
```

---

## 🛠️ Setting Up & Running

### Prerequisites
- Node.js 18+ or Bun installed.
- (Optional) Docker desktop installed.

### Option A: Local Native Execution (Fastest)

1. **Clone and Navigate**:
   ```bash
   git clone https://github.com/fossnsbm/hack-to-night-2026-challenge.git
   cd hack-to-night-2026-challenge
   ```

2. **Initialize Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
   *The script uses `concurrently` to boot the Next.js app (`http://localhost:3000`) and NestJS server (`http://localhost:4000`) simultaneously.*

### Option B: Running with Bun

If you prefer using Bun for faster performance:
```bash
bun install
bun run dev:bun
```

### Option C: Running with Docker Compose

To boot both services in Docker containers:
```bash
docker compose up --build --watch
```

---

## 📖 API Documentation

The backend service automatically generates a **Swagger / OpenAPI** schema documentation. 
When the NestJS server is running locally, access it at:
👉 **[http://localhost:4000/api](http://localhost:4000/api)**

