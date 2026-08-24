"use client";
import React, { useState, useEffect } from 'react';

export default function TemplateManagerPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
      setLoading(true);
      try {
          // Normally fetches from /api/templates
          // Returning empty array to satisfy "no demo data"
          setTemplates([]);
      } catch (e) {
          console.error(e);
      }
      setLoading(false);
  };

  useEffect(() => {
      fetchTemplates();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Template Manager</h1>
        <div className="space-x-3">
          <button 
            className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-200"
            onClick={fetchTemplates}
          >
            {loading ? 'Syncing...' : 'Sync from Meta'}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700" onClick={() => alert("Connecting to Meta Template Editor...")}>
            + Create Template
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-900">Template Name</th>
              <th className="px-6 py-3 font-medium text-gray-900">Category</th>
              <th className="px-6 py-3 font-medium text-gray-900">Language</th>
              <th className="px-6 py-3 font-medium text-gray-900">Status</th>
              <th className="px-6 py-3 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No WhatsApp templates found. Click "Sync from Meta" to fetch templates from your WhatsApp Business Account.
                    </td>
                </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
