<div align="center">

# 💳 Loan Management System

### A Full-Stack Enterprise Loan Lifecycle Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Zod](https://img.shields.io/badge/Validation-Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://zod.dev/)
[![Multer](https://img.shields.io/badge/Upload-Multer-FF6600?style=flat-square)](https://github.com/expressjs/multer)
[![Bcrypt](https://img.shields.io/badge/Security-Bcrypt-4A154B?style=flat-square)](https://github.com/dcodeIO/bcrypt.js)
[![Axios](https://img.shields.io/badge/HTTP-Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/)
[![Lucide](https://img.shields.io/badge/Icons-Lucide-F56565?style=flat-square)](https://lucide.dev/)

<br/>

> **Production-ready** loan origination & servicing platform with a borrower self-service portal, multi-role operations dashboard, built-in Business Rule Engine (BRE), and end-to-end loan lifecycle management — from application to closure.

<br/>

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Seed Users](#-seed-users--test-accounts) · [Project Structure](#-project-structure)

</div>

---

## ✨ Features

### 🏦 Borrower Portal
- **Multi-step Loan Application** — guided 3-step flow: Personal Info → Loan Details → Document Upload
- **KYC Profile Management** — PAN validation, DOB, salary, employment mode
- **Salary Slip Upload** — supports PDF, JPG, PNG (max 5 MB) via drag-and-drop
- **Real-time BRE Validation** — instant eligibility check with detailed failure reasons
- **Loan Status Tracking** — live status updates across the full lifecycle
- **EMI Calculator** — built-in simple interest calculator with tenure slider
- **Payment History** — view all repayment records with UTR references

### 📊 Operations Dashboard (Role-Based)

| Module | Role | Capabilities |
|--------|------|-------------|
| **Sales** | `sales` | View all borrower leads, track BRE status & profiles |
| **Sanction** | `sanction` | Review applied loans, approve/reject with remarks |
| **Disbursement** | `disbursement` | View sanctioned loans, mark as disbursed |
| **Collection** | `collection` | Track disbursed loans, record payments via UTR, auto-close on full repayment |
| **Admin** | `admin` | Full access to all dashboard modules |

### 🔐 Security & Auth
- JWT-based authentication with configurable expiry
- Role-Based Access Control (RBAC) middleware
- Bcrypt password hashing (salt rounds: 10)
- Rate limiting on API endpoints
- Auto session expiry & redirect on 401

### 🎨 UI/UX
- **Dark/Light Mode** — system-aware with manual toggle, persisted in localStorage
- **Responsive Design** — mobile-first with collapsible sidebar
- **Premium Fintech Aesthetic** — glassmorphism, micro-animations, curated color palette
- **Toast Notifications** — auto-dismissing feedback for all operations
- **Skeleton Loaders** — shimmer animations during data fetches

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js 16)                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Auth     │  │ Borrower     │  │ Dashboard                 │  │
│  │ (Login/  │  │ Portal       │  │ ┌───────┐ ┌────────────┐  │  │
│  │ Register)│  │ (Apply Flow) │  │ │ Sales │ │ Sanction   │  │  │
│  └──────────┘  └──────────────┘  │ ├───────┤ ├────────────┤  │  │
│                                  │ │Disburse│ │ Collection │  │  │
│                                  │ └───────┘ └────────────┘  │  │
│                                  └───────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │  REST API (JSON)
┌──────────────────────▼──────────────────────────────────────────┐
│                       SERVER (Express + TS)                      │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Auth       │  │ RBAC     │  │ BRE      │  │ File Upload  │  │
│  │ Middleware │  │ Guard    │  │ Service   │  │ (Multer)     │  │
│  └────────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Mongoose ODM → MongoDB Atlas                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Loan Lifecycle State Machine

```
  ┌──────────┐     Sanction      ┌─────────────┐    Disburse    ┌────────────┐   Full Payment  ┌────────┐
  │ APPLIED  │ ───────────────►  │ SANCTIONED  │ ────────────► │ DISBURSED  │ ──────────────► │ CLOSED │
  └──────────┘                   └─────────────┘               └────────────┘                 └────────┘
       │                                                             │
       │  Reject                                                     │  Partial Payment
       ▼                                                             ▼
  ┌──────────┐                                               (balance updated)
  │ REJECTED │
  └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | ≥ 18.x |
| **npm** | ≥ 9.x |
| **MongoDB** | Atlas (cloud) or local instance |

### 1. Clone the Repository

```bash
git clone https://github.com/david-one8/Loan-Management-System.git
cd Loan-Management-System
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/loan_management_system?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=5d
```

> 💡 **Tip:** Generate a secure `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Seed the Database

```bash
npm run seed
```

This creates 6 pre-configured user accounts for every role. See [Seed Users](#-seed-users--test-accounts) below.

### 4. Start the Server

```bash
npm run dev
```

Server starts at `http://localhost:5000`. Verify via `http://localhost:5000/health`.

### 5. Setup the Client

```bash
cd ../client
npm install
```

Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 6. Start the Client

```bash
npm run dev
```

Client starts at `http://localhost:3000`.

---

## 👥 Seed Users & Test Accounts

Run `npm run seed` from the `server/` directory to populate the following accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 🔑 **Admin** | `admin@lms.com` | `Admin@123` | Full access to all dashboard modules |
| 📈 **Sales** | `sales@lms.com` | `Sales@123` | Sales lead tracker |
| ✅ **Sanction** | `sanction@lms.com` | `Sanction@123` | Loan approval/rejection |
| 💰 **Disbursement** | `disburse@lms.com` | `Disburse@123` | Loan disbursement |
| 💳 **Collection** | `collection@lms.com` | `Collection@123` | Payment recording |
| 👤 **Borrower** | `borrower@lms.com` | `Borrower@123` | Borrower self-service portal |

> ⚠️ **Note:** The seed script uses `findOneAndUpdate` with `upsert: true`, so it's safe to run multiple times without creating duplicate accounts.

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new borrower account | ❌ |
| `POST` | `/auth/login` | Login & receive JWT token | ❌ |
| `GET` | `/auth/me` | Get current user profile | ✅ |

### Borrower Routes `(role: borrower)`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/borrower/profile` | Get borrower KYC profile |
| `POST` | `/borrower/profile` | Save/update profile (triggers BRE) |
| `POST` | `/borrower/upload-slip` | Upload salary slip (PDF/JPG/PNG, max 5MB) |
| `POST` | `/borrower/apply` | Apply for a loan (amount + tenure) |
| `GET` | `/borrower/loan` | Get borrower's active loan |
| `GET` | `/borrower/loan/:loanId/payments` | Get payment history for a loan |

### Sales Routes `(role: sales, admin)`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sales/leads` | Get all borrower leads with profiles |

### Sanction Routes `(role: sanction, admin)`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sanction/loans` | Get all loans in `applied` status |
| `PATCH` | `/sanction/loans/:id` | Approve or reject a loan |

### Disbursement Routes `(role: disbursement, admin)`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/disbursement/loans` | Get all `sanctioned` loans |
| `PATCH` | `/disbursement/loans/:id/disburse` | Mark a loan as disbursed |

### Collection Routes `(role: collection, admin)`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/collection/loans` | Get all `disbursed` loans |
| `POST` | `/collection/loans/:id/payment` | Record a payment (UTR, amount, date) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check → `{ status: "ok" }` |

---

## 🧠 Business Rule Engine (BRE)

The BRE automatically validates borrower eligibility when a profile is submitted. **All 4 rules must pass:**

| # | Rule | Criteria |
|---|------|----------|
| 1 | **Age** | Must be between 23–50 years (inclusive) |
| 2 | **Monthly Salary** | Must be ≥ ₹25,000 |
| 3 | **PAN Format** | Must match `AAAAA9999A` pattern (5 letters + 4 digits + 1 letter) |
| 4 | **Employment** | Must not be `unemployed` (accepted: salaried, self-employed) |

> On failure, the BRE returns the **first failing rule's** detailed message. The borrower cannot apply for a loan until all BRE rules pass.

---

## 📂 Project Structure

```
Loan-Management-System/
│
├── client/                          # Frontend — Next.js 16 + React 19
│   ├── app/
│   │   ├── (auth)/                  # Auth pages (grouped route)
│   │   │   ├── login/               # Login page
│   │   │   └── register/            # Registration page
│   │   ├── apply/                   # Borrower loan application flow
│   │   │   ├── personal/            # Step 1: Personal details + BRE
│   │   │   ├── loan/                # Step 2: Loan amount & tenure
│   │   │   ├── upload/              # Step 3: Salary slip upload
│   │   │   ├── status/              # Loan status tracking
│   │   │   └── layout.tsx           # Step progress bar layout
│   │   ├── dashboard/               # Operations dashboard
│   │   │   ├── sales/               # Sales lead tracker
│   │   │   ├── sanction/            # Loan approval panel
│   │   │   ├── disbursement/        # Disbursement panel
│   │   │   ├── collection/          # Payment collection panel
│   │   │   ├── layout.tsx           # Sidebar + Topbar layout
│   │   │   └── page.tsx             # Role-based redirect
│   │   ├── globals.css              # Global styles & CSS variables
│   │   ├── layout.tsx               # Root layout (theme, fonts, providers)
│   │   └── page.tsx                 # Landing redirect
│   ├── components/
│   │   ├── layout/                  # Sidebar, Topbar, StepProgressBar
│   │   ├── loan/                    # LoanCalculator, PaymentHistoryTable
│   │   └── ui/                      # Reusable UI (Button, Card, Modal,
│   │                                #   Table, Badge, Toast, Input, etc.)
│   ├── context/
│   │   └── AuthContext.tsx           # JWT auth state management
│   ├── lib/
│   │   ├── api.ts                   # HTTP client (fetch wrapper)
│   │   └── utils.ts                 # Helpers (formatCurrency, JWT decode)
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript interfaces
│   ├── tailwind.config.ts           # Custom theme (brand colors, animations)
│   ├── next.config.ts               # Next.js configuration
│   └── package.json
│
├── server/                          # Backend — Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                # MongoDB connection (Mongoose)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts   # Register, Login, Me
│   │   │   ├── borrower.controller.ts # Profile, Upload, Apply, Loan
│   │   │   ├── sales.controller.ts  # Lead tracking
│   │   │   ├── sanction.controller.ts # Approve/Reject loans
│   │   │   ├── disbursement.controller.ts # Disburse loans
│   │   │   └── collection.controller.ts   # Record payments
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   └── rbac.middleware.ts    # Role-based access guard
│   │   ├── models/
│   │   │   ├── User.model.ts        # User schema (6 roles)
│   │   │   ├── BorrowerProfile.model.ts # KYC + BRE status
│   │   │   ├── Loan.model.ts        # Loan lifecycle schema
│   │   │   └── Payment.model.ts     # Payment records (UTR)
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # /api/auth/*
│   │   │   ├── borrower.routes.ts   # /api/borrower/*
│   │   │   ├── sales.routes.ts      # /api/sales/*
│   │   │   ├── sanction.routes.ts   # /api/sanction/*
│   │   │   ├── disbursement.routes.ts # /api/disbursement/*
│   │   │   └── collection.routes.ts # /api/collection/*
│   │   ├── services/
│   │   │   └── bre.service.ts       # Business Rule Engine (4 rules)
│   │   ├── types/
│   │   │   └── express.d.ts         # Express Request augmentation
│   │   ├── index.ts                 # App entry point
│   │   └── seed.ts                  # Database seeder (6 users)
│   ├── uploads/                     # Uploaded salary slips
│   ├── tsconfig.json
│   └── package.json
│
└── README.md                        # ← You are here
```

---

## 🗄️ Database Models

### User
| Field | Type | Details |
|-------|------|---------|
| `email` | String | Unique, lowercase, trimmed |
| `password` | String | Bcrypt hashed |
| `role` | Enum | `admin` · `sales` · `sanction` · `disbursement` · `collection` · `borrower` |
| `createdAt` | Date | Auto-generated |

### BorrowerProfile
| Field | Type | Details |
|-------|------|---------|
| `userId` | ObjectId | References `User` (unique) |
| `fullName` | String | Trimmed |
| `pan` | String | Uppercase, validated by BRE |
| `dob` | Date | Used for age calculation |
| `monthlySalary` | Number | Minimum ₹25,000 for BRE pass |
| `employmentMode` | Enum | `salaried` · `self-employed` · `unemployed` |
| `salarySlipUrl` | String | File path on server |
| `breStatus` | Enum | `pending` · `passed` · `failed` |
| `breFailReason` | String | First failing BRE rule message |

### Loan
| Field | Type | Details |
|-------|------|---------|
| `borrowerId` | ObjectId | References `User` |
| `profileId` | ObjectId | References `BorrowerProfile` |
| `amount` | Number | Loan principal |
| `tenure` | Number | Loan term (months) |
| `interestRate` | Number | Default: 12% |
| `simpleInterest` | Number | Calculated: `P × R × T / 100` |
| `totalRepayment` | Number | `amount + simpleInterest` |
| `totalPaid` | Number | Running total of payments |
| `outstandingBalance` | Number | `totalRepayment - totalPaid` |
| `status` | Enum | `applied` · `sanctioned` · `disbursed` · `closed` · `rejected` |

### Payment
| Field | Type | Details |
|-------|------|---------|
| `loanId` | ObjectId | References `Loan` |
| `utrNumber` | String | Unique transaction reference |
| `amount` | Number | Payment amount |
| `paymentDate` | Date | Date of payment |
| `recordedBy` | ObjectId | References `User` (collection officer) |

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | `your_secret_key` |
| `JWT_EXPIRES_IN` | Token expiry duration | `5d` |

### Client (`client/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## 🛠️ Available Scripts

### Server

| Script | Command | Description |
|--------|---------|-------------|
| **Dev** | `npm run dev` | Start with hot-reload (`ts-node-dev`) |
| **Build** | `npm run build` | Compile TypeScript → `dist/` |
| **Start** | `npm run start` | Run compiled production build |
| **Seed** | `npm run seed` | Populate database with test users |

### Client

| Script | Command | Description |
|--------|---------|-------------|
| **Dev** | `npm run dev` | Start Next.js dev server |
| **Build** | `npm run build` | Production build |
| **Start** | `npm run start` | Serve production build |
| **Lint** | `npm run lint` | Run ESLint |

---

## 🧰 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **Font** | Inter (Google Fonts) |
| **Backend** | Express.js 4 |
| **Database** | MongoDB (Mongoose 8 ODM) |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Hashing** | bcryptjs |
| **Validation** | Zod 4 |
| **File Upload** | Multer |
| **Rate Limiting** | express-rate-limit |

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [David](https://github.com/david-one8)**

⭐ Star this repo if you found it useful!

</div>
