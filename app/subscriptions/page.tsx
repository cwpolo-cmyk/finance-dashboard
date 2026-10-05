import { createClient } from "@/lib/supabase/server";
import SubscriptionsList from "@/components/subscriptions/SubscriptionsList";

export default async function SubscriptionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user?.id || "")
    .order("last_charged", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscriptions</h1>

        {!subscriptions || subscriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-600">No subscriptions detected yet. Upload statements to detect recurring charges.</p>
          </div>
        ) : (
          <SubscriptionsList subscriptions={subscriptions} />
        )}
      </div>
    </div>
  );
}
