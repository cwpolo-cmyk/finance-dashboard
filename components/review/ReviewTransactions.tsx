"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TransactionTable from "./TransactionTable";
import ReconciliationCheck from "./ReconciliationCheck";

interface Transaction {
  id: string;
  date: string;
  raw_description: string;
  merchant_name: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  confidence: number;
  user_tag: string | null;
  user_status: string | null;
}

interface Upload {
  id: string;
  filename: string;
  total_debits?: number;
  total_credits?: number;
}

export default function ReviewTransactions({
  uploadId,
  transactions: initialTransactions,
  upload,
}: {
  uploadId: string;
  transactions: Transaction[];
  upload: Upload;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleConfirmSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Filter out deleted transactions (user_status = "deleted")
      const validTransactions = transactions.filter(
        (t) => t.user_status !== "deleted"
      );

      if (validTransactions.length === 0) {
        setError("No transactions to save");
        setSaving(false);
        return;
      }

      // Update transactions in database
      const { error: updateError } = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          transactions: validTransactions,
        }),
      }).then((r) => r.json());

      if (updateError) {
        throw new Error(updateError);
      }

      // Detect subscriptions after successful save
      await detectSubscriptions(uploadId);

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transactions");
    } finally {
      setSaving(false);
    }
  };

  const detectSubscriptions = async (uploadId: string) => {
    try {
      await fetch("/api/subscriptions/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
    } catch (err) {
      console.error("Failed to detect subscriptions:", err);
      // Don't block save if subscription detection fails
    }
  };

  const handleDeleteRow = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, user_status: "deleted" } : t
      )
    );
  };

  const handleUndeleteRow = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, user_status: null } : t
      )
    );
  };

  const activeTransactions = transactions.filter(
    (t) => t.user_status !== "deleted"
  );
  const lowConfidenceTransactions = activeTransactions.filter(
    (t) => t.confidence < 0.7
  );

  return (
    <div className="space-y-8">
      {/* Alert section */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {lowConfidenceTransactions.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ {lowConfidenceTransactions.length} transaction
            {lowConfidenceTransactions.length !== 1 ? "s" : ""} have low confidence
            ({lowConfidenceTransactions
              .map((t) => (t.confidence * 100).toFixed(0))
              .join(", ")}
            %). Please review these carefully.
          </p>
        </div>
      )}

      {/* Transaction table */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Transactions ({activeTransactions.length})
        </h2>
        <TransactionTable
          transactions={activeTransactions}
          onDeleteRow={handleDeleteRow}
          deletedIds={transactions
            .filter((t) => t.user_status === "deleted")
            .map((t) => t.id)}
          onUndeleteRow={handleUndeleteRow}
        />
      </div>

      {/* Deleted transactions section */}
      {transactions.filter((t) => t.user_status === "deleted").length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Deleted ({transactions.filter((t) => t.user_status === "deleted").length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 space-y-2">
              {transactions
                .filter((t) => t.user_status === "deleted")
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <p className="text-sm line-through text-gray-500">
                        {t.date} • {t.merchant_name} • ${t.amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUndeleteRow(t.id)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Restore
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation check */}
      <ReconciliationCheck
        transactions={activeTransactions}
        upload={upload}
      />

      {/* Action buttons */}
      <div className="flex gap-4 justify-end pt-8">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmSave}
          disabled={saving || activeTransactions.length === 0}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {saving ? "Saving..." : "Confirm & Save"}
        </button>
      </div>
    </div>
  );
}
