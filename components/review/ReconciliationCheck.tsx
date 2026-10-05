"use client";

interface Transaction {
  amount: number;
  type: "debit" | "credit";
}

interface Upload {
  id: string;
  total_debits?: number;
  total_credits?: number;
}

export default function ReconciliationCheck({
  transactions,
  upload,
}: {
  transactions: Transaction[];
  upload: Upload;
}) {
  const extractedDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const extractedCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const statementDebits = upload.total_debits || 0;
  const statementCredits = upload.total_credits || 0;

  const debitMatch =
    statementDebits === 0 ||
    Math.abs(extractedDebits - statementDebits) < 0.01;
  const creditMatch =
    statementCredits === 0 ||
    Math.abs(extractedCredits - statementCredits) < 0.01;

  // Only show reconciliation if we have statement totals
  if (statementDebits === 0 && statementCredits === 0) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${
      debitMatch && creditMatch
        ? "bg-green-50 border-green-200"
        : "bg-orange-50 border-orange-200"
    }`}>
      <h3 className="font-semibold text-gray-900 mb-4">Reconciliation Check</h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Debits (outflows)</p>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">
              Extracted: ${extractedDebits.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Statement: ${statementDebits.toFixed(2)}
            </p>
            {debitMatch ? (
              <span className="inline-block text-sm text-green-700 font-medium">
                ✓ Match
              </span>
            ) : (
              <div>
                <span className="inline-block text-sm text-orange-700 font-medium">
                  ⚠️ Difference: ${Math.abs(extractedDebits - statementDebits).toFixed(2)}
                </span>
                <p className="text-xs text-orange-600 mt-1">
                  This could be due to partially visible transactions or extraction errors.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Credits (inflows)</p>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">
              Extracted: ${extractedCredits.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Statement: ${statementCredits.toFixed(2)}
            </p>
            {creditMatch ? (
              <span className="inline-block text-sm text-green-700 font-medium">
                ✓ Match
              </span>
            ) : (
              <div>
                <span className="inline-block text-sm text-orange-700 font-medium">
                  ⚠️ Difference: ${Math.abs(extractedCredits - statementCredits).toFixed(2)}
                </span>
                <p className="text-xs text-orange-600 mt-1">
                  This could be due to partially visible transactions or extraction errors.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!debitMatch || !creditMatch && (
        <p className="text-xs text-gray-600 mt-4">
          Review low-confidence transactions or check if the statement shows all transactions in the period.
        </p>
      )}
    </div>
  );
}
