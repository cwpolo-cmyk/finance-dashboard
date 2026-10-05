import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { extname } from "path";
import crypto from "crypto";
import { extractTransactions } from "@/lib/claude/extract";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/heic",
      "image/heif",
    ];

    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Calculate SHA-256 hash for deduplication
    const hash = crypto
      .createHash("sha256")
      .update(uint8Array)
      .digest("hex");

    // Check for duplicate files by hash
    const { data: existingUpload } = await supabase
      .from("uploads")
      .select("id")
      .eq("file_hash", hash)
      .eq("user_id", user.id)
      .single();

    if (existingUpload) {
      return NextResponse.json(
        {
          error: "This file has already been uploaded",
          uploadId: existingUpload.id,
        },
        { status: 409 }
      );
    }

    // Determine source type
    const sourceType = file.type === "application/pdf" ? "pdf" : "screenshot";

    // Store file in Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("statements")
      .upload(filePath, uint8Array, {
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create upload record
    const { data: uploadRecord, error: dbError } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        source_type: sourceType,
        file_hash: hash,
        status: "extracting",
      })
      .select()
      .single();

    if (dbError || !uploadRecord) {
      throw dbError || new Error("Failed to create upload record");
    }

    // Extract transactions using Claude
    try {
      const extraction = await extractTransactions(file, sourceType);

      // Save transactions to database
      const transactions = extraction.transactions.map((txn) => ({
        user_id: user.id,
        upload_id: uploadRecord.id,
        date: txn.date,
        raw_description: txn.raw_description,
        merchant_name: txn.merchant_name,
        amount: txn.amount,
        type: txn.type,
        category: txn.category,
        confidence: txn.confidence,
      }));

      await supabase.from("transactions").insert(transactions);

      // Update upload record with extraction details
      await supabase
        .from("uploads")
        .update({
          status: "extracted",
          statement_period_start: extraction.statement_period_start,
          statement_period_end: extraction.statement_period_end,
        })
        .eq("id", uploadRecord.id);

      return NextResponse.json({
        uploadId: uploadRecord.id,
        transactionCount: extraction.transactions.length,
        extractedData: extraction,
      });
    } catch (extractError) {
      // Update upload record with error status
      await supabase
        .from("uploads")
        .update({
          status: "error",
          error_message:
            extractError instanceof Error
              ? extractError.message
              : "Extraction failed",
        })
        .eq("id", uploadRecord.id);

      throw extractError;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An error occurred during upload",
      },
      { status: 500 }
    );
  }
}
