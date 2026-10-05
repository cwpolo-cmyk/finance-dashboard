import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
    const { uploadId, transactions } = body;

    if (!uploadId || !transactions) {
      return NextResponse.json(
        { error: "Missing uploadId or transactions" },
        { status: 400 }
      );
    }

    // Verify upload belongs to user
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("id")
      .eq("id", uploadId)
      .eq("user_id", user.id)
      .single();

    if (uploadError || !upload) {
      return NextResponse.json(
        { error: "Upload not found" },
        { status: 404 }
      );
    }

    // Update transactions with user edits
    const updateData = transactions.map((txn: any) => ({
      id: txn.id,
      user_status: txn.user_status || "confirmed",
      user_tag: txn.user_tag,
      updated_at: new Date().toISOString(),
    }));

    const { error: updateError } = await supabase
      .from("transactions")
      .upsert(updateData, { onConflict: "id" });

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Transaction update error:", error);
    return NextResponse.json(
      { error: "Failed to update transactions" },
      { status: 500 }
    );
  }
}
