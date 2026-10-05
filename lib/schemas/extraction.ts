import { z } from "zod";

const TransactionSchema = z.object({
  date: z.string().describe("Transaction date in YYYY-MM-DD format"),
  raw_description: z.string().describe("Raw merchant description from statement"),
  merchant_name: z.string().describe("Normalized merchant name"),
  amount: z.number().describe("Amount in dollars"),
  type: z.enum(["debit", "credit"]).describe("Debit or credit"),
  category: z.string().describe("Category (e.g., Groceries, Utilities, Subscriptions)"),
  confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
});

export const ExtractionSchema = z.object({
  institution: z.string().describe("Bank/institution name"),
  account_last_four: z.string().describe("Last 4 digits of account number only"),
  statement_period_start: z.string().optional().describe("Period start date YYYY-MM-DD"),
  statement_period_end: z.string().optional().describe("Period end date YYYY-MM-DD"),
  transactions: z.array(TransactionSchema),
  opening_balance: z.number().optional().describe("Opening balance if available"),
  closing_balance: z.number().optional().describe("Closing balance if available"),
  total_debits: z.number().optional().describe("Sum of all debits"),
  total_credits: z.number().optional().describe("Sum of all credits"),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
