# AI Finance Assistant – Backend

> WhatsApp-powered personal finance assistant built with Express + TypeScript + Supabase + Baileys.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your Supabase credentials in `.env`.

### 3. Set up the database
Open your Supabase project → **SQL Editor** → paste and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Start the server
```bash
npm run dev
```

A QR code will appear in the terminal. Scan it with **WhatsApp** on your phone to link the session.

### 5. Test it
Send a WhatsApp message to the linked number, e.g.:
```
Spent 450 on Pizza Hut
```
You should receive an automated acknowledgment reply and see a row in the `conversation_logs` table in your Supabase dashboard.

---

## Folder Structure

```
backend/
├── src/
│   ├── config/             # Env validation (Zod)
│   ├── modules/
│   │   ├── ai/             # Phase 2 – AI transaction parser
│   │   ├── analytics/      # Phase 4 – Reports & summaries
│   │   ├── database/       # Supabase client singleton
│   │   ├── message/        # Message ingestion & acknowledgment
│   │   ├── notifications/  # Push & WhatsApp alerts
│   │   ├── transactions/   # Phase 2 – Transaction CRUD
│   │   └── whatsapp/       # Baileys client
│   ├── shared/
│   │   ├── logger.ts       # Pino logger
│   │   └── types/          # Shared TypeScript types
│   ├── app.ts              # Express app setup
│   └── server.ts           # Entry point
├── supabase/
│   └── migrations/         # Raw SQL migration files
├── sessions/               # Baileys session files (git-ignored)
├── .env.example
├── package.json
└── tsconfig.json
```

## Development Phases

| Phase | Status | Focus |
|-------|--------|-------|
| 1 | ✅ Current | Express server, WhatsApp connection, message ingestion |
| 2 | ⏳ Next | AI transaction parser, Supabase storage |
| 3 | ⏳ | React Native mobile app |
| 4 | ⏳ | Analytics, budgets, reports |
| 5 | ⏳ | Voice notes, OCR, receipts |
| 6 | ⏳ | Financial intelligence, recommendations |
