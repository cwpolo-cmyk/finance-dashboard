import UploadZone from "@/components/upload/UploadZone";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Bank Statement</h1>
        <p className="text-gray-600 mb-8">Upload a PDF or screenshot (PNG, JPG, HEIC) to extract transactions</p>

        <UploadZone />
      </div>
    </div>
  );
}
