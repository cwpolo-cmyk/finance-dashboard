# Statement Lens

Personal finance analyzer for bank statements. Upload PDFs and screenshots to extract transactions, detect subscriptions, and get actionable spending insights.

## Features (Session 1 ✓)

- ✅ Magic link authentication (locked to authorized email)
- ✅ Upload bank statement PDFs and screenshots (PNG/JPG/HEIC)
- ✅ Claude AI-powered transaction extraction
- ✅ Manual transaction review before saving
- ✅ Reconciliation check against statement totals
- ✅ Auto-detect recurring charges and subscriptions
- ✅ Mark subscriptions as Keep/Cancel/Investigate

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL + Storage
- **Auth**: Supabase Magic Link (email OTP)
- **AI**: Anthropic Claude API (claude-3-5-sonnet)

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic Claude API key

### Environment Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

3. Fill in your environment variables (see `.env.example`)

### Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and run the schema:
   ```bash
   # Run the entire contents of supabase/schema.sql
   ```
3. Create a storage bucket named `statements` (private)
4. Enable RLS on the storage bucket

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your magic link.

## Project Structure

```
.
├── app/
│   ├── auth/                    # Authentication pages & callbacks
│   ├── upload/                  # Upload bank statements
│   ├── review/[uploadId]/       # Review & confirm transactions
│   ├── subscriptions/           # View detected subscriptions
│   ├── analysis/                # Spending analysis (Session 2)
│   └── api/                     # API routes
├── components/
│   ├── auth/                    # Auth UI components
│   ├── upload/                  # Upload drag-drop zone
│   ├── review/                  # Transaction review table
│   └── subscriptions/           # Subscription list
├── lib/
│   ├── supabase/                # Supabase client setup
│   ├── claude/                  # Claude extraction logic
│   ├── prompts/                 # AI prompts (versioned)
│   ├── schemas/                 # Zod validation schemas
│   └── utils/                   # Utility functions
├── supabase/
│   └── schema.sql               # Database schema & RLS policies
└── middleware.ts                # Auth middleware
```

## How It Works

### 1. Upload

- Drag-drop or select PDF/screenshot
- Files stored in Supabase Storage (private bucket)
- SHA-256 hash calculated for deduplication

### 2. Extract

- File sent to Claude with vision/PDF capabilities
- Claude extracts: transactions, merchants, amounts, dates, categories
- Confidence scores calculated (0-1)
- Sensitive data scrubbed (full account numbers → last 4 only)

### 3. Review

- Review extracted transactions in table
- Flag low-confidence rows
- Delete incorrect transactions
- Reconciliation check vs statement totals
- Confirm and save

### 4. Subscriptions

- Analyze all transactions for repeat merchants
- Group by merchant + amount
- Detect cadence (weekly/monthly/annual)
- Surface for user review

## Security & Privacy

- **Auth**: Magic link email OTP; locked to one authorized email
- **Storage**: Private Supabase bucket; file paths tied to user ID
- **Database**: Row-level security (RLS); users see only their data
- **Sensitive Data**: Full account numbers never stored; last 4 digits only
- **Prompt Injection**: AI treats all file content as DATA, never instructions
- **No Tracking**: No third-party analytics or tracking scripts

## API Routes

### POST `/api/upload`

Upload and extract transactions from file.

- Request: `multipart/form-data` with `file`
- Response: `{ uploadId, transactionCount, extractedData }`

### POST `/api/transactions`

Update transaction status after review.

- Request: `{ uploadId, transactions: [...] }`

### POST `/api/subscriptions/detect`

Detect recurring charges from all user transactions.

### PATCH `/api/subscriptions/[id]`

Update subscription status (keep/cancel/investigate).

## Next Steps (Session 2)

- [ ] Analysis dashboard (spending by category, merchant, month)
- [ ] "Possibly unused" subscription detection
- [ ] Price increase detection
- [ ] Fee analysis and breakdown
- [ ] AI analysis report (text report + actionable items)
- [ ] "Ask about spending" chat interface
- [ ] CSV export (transactions + subscriptions)
- [ ] PDF report export
- [ ] Upload history page
- [ ] Merchant normalization rules editor
- [ ] Business vs Personal tagging
- [ ] Delete all data button

## Notes for Deployment

- Set `NEXT_PUBLIC_APP_URL` to your production URL for magic link redirects
- Ensure Supabase Auth email is configured for production
- Store `ANTHROPIC_API_KEY` in production secrets only (server-side)
- Keep `AUTHORIZED_EMAIL` in secrets if deploying for single user

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
