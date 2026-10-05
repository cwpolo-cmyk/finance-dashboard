# Statement Lens - Session 1 Summary & Next Steps

## Session 1 Completed ✅

### Core Infrastructure
- [x] Next.js + TypeScript + Tailwind setup
- [x] Supabase integration (auth, database, storage)
- [x] Magic link authentication (email OTP, single-user)
- [x] Middleware for route protection
- [x] Row-level security (RLS) on all database tables
- [x] Private storage bucket for file uploads

### Features Implemented
- [x] **Upload Page**: Drag-drop + file picker, multi-file support, validation (PDF/PNG/JPG/HEIC, max 20MB)
- [x] **Extraction**: Claude API integration for vision + PDF processing
  - PDFs via Claude document API
  - Screenshots via Claude vision
  - Prompt-based extraction with strict JSON schema
  - Retry logic on parse failures
  - Sensitive data scrubbing (full account numbers → last 4 only)
- [x] **Review Page**: Transaction table with:
  - Low-confidence flag highlighting
  - Delete/restore functionality
  - Reconciliation check (sum vs statement totals)
  - Confirmation & save flow
- [x] **Subscriptions Detection**: Auto-detect recurring charges
  - Group by merchant + amount
  - Detect cadence (weekly/monthly/annual/etc.)
  - Calculate monthly and annual costs
  - Mark as Keep/Cancel/Investigate
- [x] **Dashboard**: Home page with quick navigation and stat placeholders

### Database Schema
- [x] `users` - Supabase Auth integration
- [x] `accounts` - Bank/credit card accounts
- [x] `uploads` - File metadata + extraction status
- [x] `transactions` - Extracted transactions with confidence scores
- [x] `subscriptions` - Detected recurring charges
- [x] `merchant_mappings` - User-defined normalization (for session 2)
- [x] `analyses` - Stored analysis reports (for session 2)
- [x] `user_settings` - User preferences (for session 2)

### Zod Schemas
- [x] ExtractionSchema (validates Claude output)
- [x] TransactionSchema (individual transaction validation)

### Prompts
- [x] `extract-v1.md` - Detailed extraction prompt with:
  - Privacy-first guidelines
  - Confidence scoring rules
  - Output format specification
  - Account info extraction

### API Routes
- [x] POST `/api/upload` - Handle file upload, storage, extraction
- [x] POST `/api/transactions` - Update transaction statuses after review
- [x] POST `/api/subscriptions/detect` - Auto-detect subscriptions
- [x] PATCH `/api/subscriptions/[id]` - Update subscription status

### Documentation
- [x] README with setup instructions
- [x] `.env.example` with all required variables
- [x] Code comments on critical functions

## Known Limitations & To-Do for Session 2

### High Priority

1. **Analysis Report & Dashboard**
   - Spending by category (pie/bar chart)
   - Spending by merchant (top 10)
   - Month-over-month trends
   - Fee detection and totaling
   - Action list with estimated savings
   - Price increase detection

2. **Chat Interface**
   - "Ask about my spending" search box
   - Ground answers in actual transactions
   - Show transactions used in answer

3. **Exports**
   - CSV export of transactions
   - CSV export of subscriptions
   - PDF report (printable)

4. **Upload History**
   - List of all uploaded files
   - Re-run extraction on a file
   - Delete file + associated transactions

5. **Data Management**
   - Delete all data button
   - Merchant normalization editor (map "AMZN Mktp" → "Amazon")

### Medium Priority

6. **Subscription Enhancements**
   - "Possibly unused" detection (no activity in last N months)
   - Duplicate subscription detection (same service, different merchants)
   - How-to-cancel hints in UI
   - Free trial → paid conversion detection

7. **User Tags**
   - Personal vs Business tagging UI on transactions
   - Filter/report by tag
   - Business expense export for taxes

8. **UI/UX Polish**
   - Mobile-first layout optimization
   - Loading states and skeletons
   - Error toasts/notifications
   - Empty states on all pages

### Lower Priority (Session 3+)

9. **Advanced Features**
   - Recurring transaction rules (auto-categorize)
   - Budget tracking and alerts
   - Spending goals
   - Connected accounts (with Plaid - future)
   - Mobile app (React Native)

## Architecture Decisions Made

### Why Claude for Extraction
- Vision capabilities for screenshots
- Native PDF support
- Reliable JSON output with Zod validation
- Better than OCR for noisy/handwritten statements

### Why Supabase
- Built-in auth (magic links, no password management)
- PostgreSQL for relational data
- Private storage with RLS
- Easy to extend with custom SQL

### Why Single-User for Now
- Simpler security model
- Focused UX
- Can easily multi-tenant later with RLS tweaks

### Schema Design Notes
- `transactions.user_status` for deleted rows (soft delete)
- `subscriptions` uses `amount` + `merchant_name` for upsert detection
- `file_hash` prevents duplicate uploads (SHA-256)
- `confidence` score guides review process (low-confidence highlighting)

## Testing Checklist (Before Session 2)

- [ ] Test with real bank statement PDF
- [ ] Test with real Citibank screenshot
- [ ] Verify deduplication (upload same file twice)
- [ ] Test low-confidence flagging
- [ ] Test reconciliation check (both match & mismatch)
- [ ] Test subscription detection (verify cadence calculation)
- [ ] Test auth redirect (unauthenticated → /auth)
- [ ] Test magic link flow
- [ ] Verify sensitive data scrubbing (no full account numbers in DB)

## Deployment Checklist

1. **Environment**
   - [ ] Set all vars in Vercel dashboard
   - [ ] Supabase URL and keys
   - [ ] Claude API key
   - [ ] Authorized email

2. **Supabase**
   - [ ] Run schema.sql in production project
   - [ ] Create `statements` storage bucket (private)
   - [ ] Enable RLS on storage bucket
   - [ ] Configure Auth email (Settings > Auth > Email Templates)

3. **Security**
   - [ ] Verify no logs contain financial data
   - [ ] Check that only last 4 digits stored
   - [ ] Confirm RLS policies in place
   - [ ] Test that user can't see other users' data

4. **Monitoring**
   - [ ] Set up error logging (Sentry or similar)
   - [ ] Monitor Claude API usage/costs
   - [ ] Track file upload sizes in Supabase

## Cost Estimate (Current Usage)

- **Supabase**: ~$10-25/mo (storage + database)
- **Claude API**: ~$0.50-5/mo per user (depending on PDF sizes)
- **Vercel**: Free tier likely sufficient; $20/mo if needed
- **Total**: ~$30-50/mo baseline

## Questions for User Before Session 2

1. Should we implement "possibly unused" detection immediately or wait for more data?
2. Do you want the analysis report as text or interactive dashboard or both?
3. Should we build the chat interface in session 2 or defer to session 3?
4. Any specific merchants/subscriptions you know about that might not be detected?
5. Do you want to categorize transactions yourself or auto-categorize?

## File Structure Final Check

```
statement-lens/
├── app/
│   ├── layout.tsx                 # ✅
│   ├── page.tsx                   # ✅ (dashboard)
│   ├── auth/
│   │   ├── callback/route.ts      # ✅
│   │   └── page.tsx               # ✅
│   ├── upload/
│   │   └── page.tsx               # ✅
│   ├── review/[uploadId]/
│   │   └── page.tsx               # ✅
│   ├── subscriptions/
│   │   └── page.tsx               # ✅
│   ├── analysis/
│   │   └── page.tsx               # ⚠️ (placeholder)
│   └── api/
│       ├── upload/route.ts        # ✅
│       ├── transactions/route.ts  # ✅
│       └── subscriptions/
│           ├── detect/route.ts    # ✅
│           └── [id]/route.ts      # ✅
├── components/
│   ├── auth/
│   │   └── LogoutButton.tsx       # ✅
│   ├── upload/
│   │   └── UploadZone.tsx         # ✅
│   ├── review/
│   │   ├── ReviewTransactions.tsx # ✅
│   │   ├── TransactionTable.tsx   # ✅
│   │   └── ReconciliationCheck.tsx # ✅
│   └── subscriptions/
│       └── SubscriptionsList.tsx  # ✅
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # ✅
│   │   └── server.ts              # ✅
│   ├── claude/
│   │   └── extract.ts             # ✅
│   ├── prompts/
│   │   └── extract-v1.md          # ✅
│   └── schemas/
│       └── extraction.ts          # ✅
├── supabase/
│   └── schema.sql                 # ✅
├── middleware.ts                  # ✅
├── README.md                      # ✅
├── NEXT_STEPS.md                  # ✅ (this file)
└── .env.example                   # ✅
```

## Notes for Handoff

- Code is clean and modular; each component has a single responsibility
- Prompts are in dedicated files for easy versioning
- Zod schemas validate all Claude responses
- API routes follow RESTful conventions
- Database uses RLS for security (not app-level checks)
- No sensitive data in logs or URLs

Ready for Session 2. The core transaction extraction and subscription detection pipeline works end-to-end. Next step is building the analysis layer on top of the saved data.
