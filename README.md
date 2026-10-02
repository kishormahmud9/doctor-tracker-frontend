# Doctor Tracker - Frontend Application

A modern, responsive, high-performance web dashboard application for the Doctor Tracker platform built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

---

## Architecture & Directory Structure

```text
frontend/
├── public/                     # Static assets (favicons, SVGs)
├── src/
│   ├── app/                    # Next.js App Router (pages and layouts)
│   │   ├── dashboard/          # Authenticated application portal
│   │   │   ├── doctors/        # Doctor management directory & modal operations
│   │   │   │   └── page.tsx
│   │   │   ├── patients/       # Patient management directory & modal operations
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx      # Protected dashboard shell layout
│   │   │   └── page.tsx        # Dashboard overview & analytics charts
│   │   ├── login/              # Admin login page
│   │   │   └── page.tsx
│   │   ├── globals.css         # Tailwind directives & global interactive cursor rules
│   │   ├── layout.tsx          # Root HTML layout with AuthProvider & fonts
│   │   └── page.tsx            # Root redirect controller
│   ├── components/             # Modular reusable UI components
│   │   ├── auth/               # Route protection guard (`ProtectedRoute.tsx`)
│   │   ├── dashboard/          # SummaryCards, PatientsPerDoctorChart, DateStatisticsChart, DateRangeFilter
│   │   ├── doctors/            # DoctorFormModal, DoctorPatientsModal
│   │   ├── layout/             # AppShell, Navbar, Sidebar, MobileNav, NavIcons
│   │   ├── patients/           # PatientFormModal, PatientDetailModal
│   │   └── ui/                 # Accessible primitives (Modal, ConfirmDialog)
│   ├── context/                # Global React Context providers (`AuthContext.tsx`)
│   ├── lib/                    # Centralized HTTP API client (`api.ts`), session storage (`session.ts`)
│   ├── services/               # Modular service callers (authService, doctorService, patientService, dashboardService)
│   └── types/                  # Strict shared TypeScript interfaces & API envelopes
├── .env.example                # Example environment variables template
├── .gitignore                  # Git ignore rules for Next.js and Node.js
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js build configuration
├── package.json                # Project dependencies and npm scripts
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS design tokens & plugins
└── tsconfig.json               # TypeScript compiler configuration
```

---

## Prerequisites

- **Node.js**: >= 18.x (v20.x or v22.x LTS recommended)
- **npm**: >= 9.x
- **Backend API**: The Doctor Tracker Express API running (default: `http://localhost:5000/api`)

---

## Environment Configuration

Configure the backend API URL via the `NEXT_PUBLIC_API_URL` environment variable.

Create a `.env.local` file from the provided `.env.example`:

```bash
cp .env.example .env.local
```

### Configurable Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base endpoint for the Doctor Tracker backend REST API | `http://localhost:5000/api` | Yes |

> **Important**: Never commit `.env` or `.env.local` to Git. The `.gitignore` file is configured to keep your local environment variables secure.

---

## Installation & Setup

1. **Clone or navigate to the frontend repository directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Verify environment settings**:
   Ensure `.env.local` contains the URL of your running backend:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start development server**:

   ```bash
   npm run dev
   ```

   The application will be accessible at: [http://localhost:3000](http://localhost:3000)

---

## Administrator Login & Credentials

1. **Initial Admin Account Setup**:
   Before logging in, make sure you have provisioned an administrator account in the backend database.
   From the `backend` repository directory, execute:

   ```bash
   npm run seed:admin
   ```

   Or non-interactively:

   ```bash
   npm run seed:admin -- --name "Admin" --email "admin@example.com" --password "YourStrongPassword123!"
   ```

2. **Sign In**:
   - Open [http://localhost:3000/login](http://localhost:3000/login) in your web browser.
   - Enter your administrator email and password.
   - Upon successful verification, you will receive a secure JWT token stored in browser session storage and be redirected to `/dashboard`.

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack / Fast Refresh on port 3000 |
| `npm run build` | Compiles and builds the optimized production bundle |
| `npm start` | Serves the production build (requires `npm run build` first) |
| `npm run lint` | Runs Next.js ESLint linting verification across all source files |
| `npx tsc --noEmit` | Performs TypeScript static type checking without emitting files |

---

## Interactive Elements & UX Compliance

Every interactive element across the application features:
- Explicit hover pointer cursors (`cursor: pointer` / `cursor-pointer`).
- Disabled controls equipped with `disabled:cursor-not-allowed` and appropriate opacity reductions.
- High-contrast accessible focus outlines (`focus-visible:ring-2`).
- Responsive mobile drawer navigation with backdrop click-to-close behavior.

---

## Standalone Repository Readiness

This frontend repository is completely decoupled from the backend:
- Has its own independent `package.json` and `package-lock.json`.
- Uses its own `.gitignore` and `.env.example`.
- Communicates exclusively over HTTP via `NEXT_PUBLIC_API_URL`.
- Can be deployed independently to Vercel, Netlify, AWS Amplify, Docker, or any static/Node hosting platform.

