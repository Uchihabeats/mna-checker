'use client';
import React, { useState } from 'react';
import FileUploadForm from '../components/FileUploadForm';
import FileTable from '../components/FileTable';

export default function DashboardPage() {
  const [refresh, setRefresh] = useState(false);

  const handleUpload = () => setRefresh(r => !r);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">File Dashboard</h1>
        <FileUploadForm onUpload={handleUpload} />
        <div className="mt-8">
          <FileTable key={refresh.toString()} />
        </div>
      </div>
    </div>
  );
}
