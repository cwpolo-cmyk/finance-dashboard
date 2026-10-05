import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statement Lens</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <Link
            href="/upload"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition hover:scale-105"
          >
            <div className="text-4xl mb-4">📤</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Statement</h2>
            <p className="text-gray-600">Upload a PDF or screenshot to extract transactions</p>
          </Link>

          <Link
            href="/subscriptions"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition hover:scale-105"
          >
            <div className="text-4xl mb-4">💳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscriptions</h2>
            <p className="text-gray-600">View detected recurring charges and subscriptions</p>
          </Link>

          <Link
            href="/analysis"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition hover:scale-105"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis</h2>
            <p className="text-gray-600">View detailed spending analysis and reports</p>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Stats</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">This Month</p>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Last Upload</p>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
