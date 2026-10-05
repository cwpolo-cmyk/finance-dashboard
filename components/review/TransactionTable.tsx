"use client";

interface Transaction {
  id: string;
  date: string;
  raw_description: string;
  merchant_name: string;
  amount: number;
  type: "debit" | "credit";
  category: string;
  confidence: number;
}

export default function TransactionTable({
  transactions,
  onDeleteRow,
  deletedIds,
  onUndeleteRow,
}: {
  transactions: Transaction[];
  onDeleteRow: (id: string) => void;
  deletedIds: string[];
  onUndeleteRow: (id: string) => void;
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-50 text-green-700";
    if (confidence >= 0.7) return "bg-yellow-50 text-yellow-700";
    return "bg-red-50 text-red-700";
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-900">
              Date
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">
              Description
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">
              Merchant
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900">
              Amount
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">
              Category
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-900">
              Confidence
            </th>
            <th className="px-4 py-3 text-center font-semibold text-gray-900">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr
              key={txn.id}
              className={`border-b hover:bg-gray-50 ${
                txn.confidence < 0.7 ? "bg-yellow-50" : ""
              }`}
            >
              <td className="px-4 py-3 text-gray-900 font-medium">{txn.date}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {txn.raw_description}
              </td>
              <td className="px-4 py-3 text-gray-900">{txn.merchant_name}</td>
              <td
                className={`px-4 py-3 text-right font-medium ${
                  txn.type === "debit" ? "text-red-600" : "text-green-600"
                }`}
              >
                {txn.type === "debit" ? "-" : "+"}${txn.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{txn.category}</td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(
                    txn.confidence
                  )}`}
                >
                  {(txn.confidence * 100).toFixed(0)}%
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                {deletedIds.includes(txn.id) ? (
                  <button
                    onClick={() => onUndeleteRow(txn.id)}
                    className="text-blue-600 hover:underline text-xs font-medium"
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={() => onDeleteRow(txn.id)}
                    className="text-red-600 hover:underline text-xs font-medium"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
