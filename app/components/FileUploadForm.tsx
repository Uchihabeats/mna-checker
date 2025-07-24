'use client';
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

interface FileUploadFormProps {
  onUpload?: () => void;
}

export default function FileUploadForm({ onUpload }: FileUploadFormProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    try {
      // 1. Upload file to tmpfiles.org (no API key needed)
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadData.status !== 'success') {
        throw new Error('Upload failed');
      }

      const fileUrl = uploadData.data.url;

      // 2. Send metadata to API
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id || 1, // Use actual user ID from session
          name: file.name,
          fileUrl,
          effectiveDate,
          expiryDate,
        }),
      });

      setLoading(false);
      if (res.ok) {
        setFile(null);
        setEffectiveDate('');
        setExpiryDate('');
        if (onUpload) onUpload();

        // Trigger notification for expiring files
        await fetch('/api/notify-expiring-files', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Error uploading file:', error);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload New File</h2>
        <p className="text-gray-600">Upload a file with effective and expiry dates</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select File
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50' 
                : file 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">{file.name}</span>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900">
                      Drop your file here, or{" "}
                      <span className="text-indigo-600 hover:text-indigo-500">browse</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, XLS, XLSX files up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEffectiveDate(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiryDate(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white transition-all ${
              loading || !file
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload File
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
