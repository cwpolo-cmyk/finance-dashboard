"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function UploadZone() {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const validateFile = (file: File): string | null => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/heic",
      "image/heif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "File type not supported. Please upload PDF, PNG, JPG, or HEIC.";
    }

    if (file.size > maxSize) {
      return "File is too large. Maximum size is 20MB.";
    }

    return null;
  };

  const handleFileSelect = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        return false;
      }
      return true;
    });

    const fileItems: FileUploadItem[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...fileItems]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    for (const fileItem of pendingFiles) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "uploading" } : f
          )
        );

        const formData = new FormData();
        formData.append("file", fileItem.file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "success", progress: 100 }
              : f
          )
        );

        // Redirect to review page
        setTimeout(() => {
          router.push(`/review/${result.uploadId}`);
        }, 500);
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f
          )
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.heic,.heif"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="mb-4 text-4xl">📄</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Drag and drop files here
        </h3>
        <p className="text-gray-600 mb-4">
          or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:underline font-medium"
          >
            choose files
          </button>
        </p>
        <p className="text-sm text-gray-500">
          Supported: PDF, PNG, JPG, HEIC (Max 20MB per file)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Files ({files.length})
          </h3>

          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{fileItem.file.name}</p>
                <p className="text-sm text-gray-600">
                  {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {fileItem.status === "uploading" && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition"
                      style={{ width: `${fileItem.progress}%` }}
                    ></div>
                  </div>
                )}

                {fileItem.status === "error" && (
                  <p className="mt-2 text-sm text-red-600">{fileItem.error}</p>
                )}
              </div>

              <div className="ml-4">
                {fileItem.status === "pending" && (
                  <span className="text-gray-500 text-sm">Pending</span>
                )}
                {fileItem.status === "uploading" && (
                  <span className="text-blue-600 text-sm">Uploading...</span>
                )}
                {fileItem.status === "success" && (
                  <span className="text-green-600 text-sm">✓ Done</span>
                )}
                {fileItem.status === "error" && (
                  <span className="text-red-600 text-sm">✗ Error</span>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={uploadFiles}
            disabled={!files.some((f) => f.status === "pending")}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition"
          >
            Upload & Extract
          </button>
        </div>
      )}
    </div>
  );
}
