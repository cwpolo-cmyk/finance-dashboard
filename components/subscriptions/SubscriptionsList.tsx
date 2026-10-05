"use client";

import { useState } from "react";

interface Subscription {
  id: string;
  merchant_name: string;
  amount: number;
  cadence: string;
  first_seen: string;
  last_charged: string;
  next_expected: string;
  user_status: string | null;
  notes: string | null;
}

export default function SubscriptionsList({
  subscriptions: initialSubscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_status: status }),
      });

      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, user_status: status } : s))
      );
    } catch (error) {
      console.error("Failed to update subscription:", error);
    }
  };

  const calculateMonthlyAndAnnual = (amount: number, cadence: string) => {
    let monthlyRate = 0;
    switch (cadence) {
      case "weekly":
        monthlyRate = amount * 4.33;
        break;
      case "biweekly":
        monthlyRate = amount * 2.165;
        break;
      case "monthly":
        monthlyRate = amount;
        break;
      case "quarterly":
        monthlyRate = amount / 3;
        break;
      case "annual":
        monthlyRate = amount / 12;
        break;
    }
    return {
      monthly: monthlyRate,
      annual: monthlyRate * 12,
    };
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    const { monthly } = calculateMonthlyAndAnnual(sub.amount, sub.cadence);
    return sum + monthly;
  }, 0);

  const totalAnnual = totalMonthly * 12;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "keep":
        return "bg-green-50 border-green-200 text-green-700";
      case "cancel":
        return "bg-red-50 border-red-200 text-red-700";
      case "investigate":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "keep":
        return "✓ Keeping";
      case "cancel":
        return "✕ Cancelled";
      case "investigate":
        return "? Investigating";
      default:
        return "No status";
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">{subscriptions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Monthly Cost</p>
          <p className="text-3xl font-bold text-gray-900">
            ${totalMonthly.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Annual Cost</p>
          <p className="text-3xl font-bold text-gray-900">
            ${totalAnnual.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Subscriptions list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-4 text-left font-semibold text-gray-900">
                Merchant
              </th>
              <th className="px-6 py-4 text-right font-semibold text-gray-900">
                Amount
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">
                Cadence
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">
                Last Charged
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">
                Monthly / Annual
              </th>
              <th className="px-6 py-4 text-left font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const { monthly, annual } = calculateMonthlyAndAnnual(
                sub.amount,
                sub.cadence
              );
              return (
                <tr key={sub.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {sub.merchant_name}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 font-medium">
                    ${sub.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {sub.cadence}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{sub.last_charged}</td>
                  <td className="px-6 py-4 text-gray-900 text-sm">
                    <span>${monthly.toFixed(2)}</span>
                    <span className="text-gray-500 ml-2">
                      / ${annual.toFixed(2)}/yr
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={sub.user_status || ""}
                        onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                        className={`text-sm px-3 py-1 rounded border ${getStatusColor(
                          sub.user_status
                        )}`}
                      >
                        <option value="">Set status...</option>
                        <option value="keep">Keep</option>
                        <option value="investigate">Investigate</option>
                        <option value="cancel">Cancel</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
