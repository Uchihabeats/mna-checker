'use client';
import React, { useEffect, useState } from 'react';

type FileRow = {
  id: number;
  name: string;
  file_url: string;
  effective_date: string;
  expiry_date: string;
  notification_status: string;
};

type SortConfig = {
  key: keyof FileRow;
  direction: 'asc' | 'desc';
};

type Filters = {
  name: string;
  effective_date: string;
  expiry_date: string;
  notification_status: string;
};

export default function FileTable() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ effective_date: string; expiry_date: string }>({ effective_date: '', expiry_date: '' });
  const [filters, setFilters] = useState<Filters>({
    name: '',
    effective_date: '',
    expiry_date: '',
    notification_status: ''
  });

  // Fetch files
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await fetch('/api/files/list');
    const data = await res.json();
    const mappedFiles = Array.isArray(data.files)
      ? data.files.map((file: any) => {
          // Helper function to add 1 day to a date
          const addOneDay = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            date.setDate(date.getDate() + 1);
            return date.toISOString().split('T')[0];
          };

          return {
            id: file.id,
            name: String(file.name ?? ''),
            file_url: file.file_url || '',
            effective_date: file.effective_date ? addOneDay(file.effective_date) : '',
            expiry_date: file.expiry_date ? addOneDay(file.expiry_date) : '',
            notification_status: file.notification_sent ? 'Success' : 'Pending',
          };
        })
      : [];
    setFiles(mappedFiles);
  };

  // Remove file
  const handleRemove = async (id: number) => {
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    fetchFiles();
  };

  // Start editing
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({
      effective_date: files[idx].effective_date.slice(0, 10),
      expiry_date: files[idx].expiry_date.slice(0, 10),
    });
  };

  // Save update
  const handleUpdate = async (idx: number) => {
    const file = files[idx];
    await fetch(`/api/files/${file.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    });

    // Trigger notification for expiring files
    await fetch('/api/notify-expiring-files', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    setEditIdx(null);
    fetchFiles();
  };

  // Filter files by name and other filters
  const filteredFiles = files.filter(file => {
    const nameMatch = typeof file.name === 'string' &&
      file.name.toLowerCase().includes(search.toLowerCase());
    
    const effectiveDateMatch = !filters.effective_date || file.effective_date === filters.effective_date;
    const expiryDateMatch = !filters.expiry_date || file.expiry_date === filters.expiry_date;
    const statusMatch = !filters.notification_status || file.notification_status === filters.notification_status;

    return nameMatch && effectiveDateMatch && expiryDateMatch && statusMatch;
  });

  // Sort files
  const sortedFiles = React.useMemo(() => {
    if (!sortConfig) return filteredFiles;
    return [...filteredFiles].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredFiles, sortConfig]);

  // Handle sort
  const handleSort = (key: keyof FileRow) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (key: keyof FileRow) => {
    return [...new Set(files.map(file => file[key]).filter(Boolean))].sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      effective_date: '',
      expiry_date: '',
      notification_status: ''
    });
    setSearch('');
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">File Management</h2>
        <p className="text-gray-600">Manage and track your uploaded files</p>
      </div>
      
      <div className="mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search files by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors text-gray-900 placeholder-gray-500"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Effective Date</label>
            <select
              value={filters.effective_date}
              onChange={e => setFilters(prev => ({ ...prev, effective_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 text-gray-900 bg-white"
            >
              <option value="" className="text-gray-600">All dates</option>
              {getUniqueValues('effective_date').map(date => (
                <option key={date} value={date} className="text-gray-900">{date}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Expiry Date</label>
            <select
              value={filters.expiry_date}
              onChange={e => setFilters(prev => ({ ...prev, expiry_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 text-gray-900 bg-white"
            >
              <option value="" className="text-gray-600">All dates</option>
              {getUniqueValues('expiry_date').map(date => (
                <option key={date} value={date} className="text-gray-900">{date}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
            <select
              value={filters.notification_status}
              onChange={e => setFilters(prev => ({ ...prev, notification_status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 text-gray-900 bg-white"
            >
              <option value="" className="text-gray-600">All statuses</option>
              {getUniqueValues('notification_status').map(status => (
                <option key={status} value={status} className="text-gray-900">{status}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    File Name 
                    <span className="text-indigo-600">
                      {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                
                <th className="py-4 px-6 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('effective_date')}>
                  <div className="flex items-center gap-2">
                    Effective Date 
                    <span className="text-indigo-600">
                      {sortConfig?.key === 'effective_date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                
                <th className="py-4 px-6 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('expiry_date')}>
                  <div className="flex items-center gap-2">
                    Expiry Date 
                    <span className="text-indigo-600">
                      {sortConfig?.key === 'expiry_date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                
                <th className="py-4 px-6 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('notification_status')}>
                  <div className="flex items-center gap-2">
                    Status 
                    <span className="text-indigo-600">
                      {sortConfig?.key === 'notification_status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </div>
                </th>
                
                <th className="py-4 px-6 text-left font-semibold text-gray-700">Download</th>
                <th className="py-4 px-6 text-left font-semibold text-gray-700">Archive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedFiles.map((file, idx) => (
                <tr key={file.id} className="hover:bg-indigo-50 transition-colors">
                  <td className="py-4 px-6 text-gray-800 font-medium max-w-xs">
                    <div className="truncate" title={file.name}>{file.name}</div>
                  </td>
                  
                  {editIdx === idx ? (
                    <>
                      <td className="py-4 px-6">
                        <input
                          type="date"
                          value={editData.effective_date}
                          onChange={e => setEditData(d => ({ ...d, effective_date: e.target.value }))}
                          className="border-2 border-gray-300 px-3 py-2 rounded-md w-full min-w-[140px] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 bg-white"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="date"
                          value={editData.expiry_date}
                          onChange={e => setEditData(d => ({ ...d, expiry_date: e.target.value }))}
                          className="border-2 border-gray-300 px-3 py-2 rounded-md w-full min-w-[140px] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900 bg-white"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          file.notification_status === 'Success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {file.notification_status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-500">—</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-3">
                          <button 
                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                            onClick={() => handleUpdate(idx)}
                          >
                            Save
                          </button>
                          <button 
                            className="inline-flex items-center px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                            onClick={() => setEditIdx(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 px-6 text-gray-700 font-mono">
                        {file.effective_date || <span className="text-gray-400">Not set</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-700 font-mono">
                        {file.expiry_date || <span className="text-gray-400">Not set</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          file.notification_status === 'Success' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {file.notification_status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <a 
                          href={file.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-3">
                          <button 
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() => handleEdit(idx)}
                          >
                            Edit
                          </button>
                          <button 
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                            onClick={() => handleRemove(file.id)}
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {sortedFiles.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No files found</h3>
          <p className="mt-2 text-gray-500">
            {search || Object.values(filters).some(f => f) ? 'Try adjusting your search or filter criteria.' : 'Upload some files to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
