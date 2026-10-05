import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewTransactions from "@/components/review/ReviewTransactions";

export default async function ReviewPage({
  params,
}: {
  params: { uploadId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch upload and transactions
  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("*")
    .eq("id", params.uploadId)
    .eq("user_id", user.id)
    .single();

  if (uploadError || !upload) {
    redirect("/upload");
  }

  const { data: transactions, error: txnError } = await supabase
    .from("transactions")
    .select("*")
    .eq("upload_id", params.uploadId)
    .order("date", { ascending: false });

  if (txnError || !transactions) {
    redirect("/upload");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review Extracted Transactions
        </h1>
        <p className="text-gray-600 mb-8">
          {upload.filename} • {transactions.length} transactions
        </p>

        <ReviewTransactions
          uploadId={params.uploadId}
          transactions={transactions}
          upload={upload}
        />
      </div>
    </div>
  );
}
