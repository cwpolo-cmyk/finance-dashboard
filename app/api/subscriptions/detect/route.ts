import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface Transaction {
  id: string;
  date: string;
  merchant_name: string;
  amount: number;
  type: string;
}

function detectCadence(
  dates: string[]
): "weekly" | "biweekly" | "monthly" | "quarterly" | "annual" | "irregular" {
  if (dates.length < 2) return "irregular";

  const sorted = dates.sort().reverse();
  const diffs: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i - 1]);
    const prev = new Date(sorted[i]);
    diffs.push(Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  if (avgDiff < 10) return "weekly";
  if (avgDiff < 20) return "biweekly";
  if (avgDiff < 35) return "monthly";
  if (avgDiff < 120) return "quarterly";
  if (avgDiff <= 400) return "annual";
  return "irregular";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId } = body;

    // Get all transactions for this user
    const { data: allTransactions, error: txnError } = await supabase
      .from("transactions")
      .select("id, date, merchant_name, amount, type")
      .eq("user_id", user.id)
      .eq("type", "debit")
      .order("date", { ascending: false });

    if (txnError || !allTransactions) {
      throw txnError || new Error("Failed to fetch transactions");
    }

    // Group by merchant and amount
    const groupedByMerchant = new Map<
      string,
      { dates: string[]; amount: number }[]
    >();

    allTransactions.forEach((txn: Transaction) => {
      if (!groupedByMerchant.has(txn.merchant_name)) {
        groupedByMerchant.set(txn.merchant_name, []);
      }
      const group = groupedByMerchant.get(txn.merchant_name)!;

      // Find or create amount group
      let amountGroup = group.find((g) => Math.abs(g.amount - txn.amount) < 0.01);
      if (!amountGroup) {
        amountGroup = { dates: [], amount: txn.amount };
        group.push(amountGroup);
      }
      amountGroup.dates.push(txn.date);
    });

    // Detect subscriptions (need at least 2 occurrences)
    const subscriptions: any[] = [];

    groupedByMerchant.forEach((merchants, merchantName) => {
      merchants.forEach((amountGroup) => {
        if (amountGroup.dates.length >= 2) {
          const cadence = detectCadence(amountGroup.dates);
          const lastDate = amountGroup.dates[0];
          const firstDate = amountGroup.dates[amountGroup.dates.length - 1];

          // Calculate next expected date
          let nextExpected = new Date(lastDate);
          switch (cadence) {
            case "weekly":
              nextExpected.setDate(nextExpected.getDate() + 7);
              break;
            case "biweekly":
              nextExpected.setDate(nextExpected.getDate() + 14);
              break;
            case "monthly":
              nextExpected.setMonth(nextExpected.getMonth() + 1);
              break;
            case "quarterly":
              nextExpected.setMonth(nextExpected.getMonth() + 3);
              break;
            case "annual":
              nextExpected.setFullYear(nextExpected.getFullYear() + 1);
              break;
          }

          subscriptions.push({
            user_id: user.id,
            merchant_name: merchantName,
            amount: amountGroup.amount,
            cadence,
            first_seen: firstDate,
            last_charged: lastDate,
            next_expected: nextExpected.toISOString().split("T")[0],
            user_status: null,
          });
        }
      });
    });

    if (subscriptions.length > 0) {
      // Upsert subscriptions (don't duplicate)
      const { error: subError } = await supabase
        .from("subscriptions")
        .upsert(subscriptions, {
          onConflict: "user_id,merchant_name,amount",
        });

      if (subError) {
        throw subError;
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionsDetected: subscriptions.length,
    });
  } catch (error) {
    console.error("Subscription detection error:", error);
    return NextResponse.json(
      { error: "Failed to detect subscriptions" },
      { status: 500 }
    );
  }
}
