'use client';

import { useState, useEffect } from 'react';

export default function TriggersPage() {
  const [triggers, setTriggers] = useState([]);
  const [flows, setFlows] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [triggersRes, flowsRes] = await Promise.all([
        fetch('http://localhost:4000/api/triggers'),
        fetch('http://localhost:4000/api/flows')
      ]);
      const triggersData = await triggersRes.json();
      const flowsData = await flowsRes.json();
      setTriggers(triggersData);
      // Only allow published flows
      setFlows(flowsData.data.filter((f: any) => f.status === 'PUBLISHED' || f.status === 'DRAFT')); 
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data', error);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || !selectedFlowId) return;

    try {
      await fetch('http://localhost:4000/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword, flowId: selectedFlowId })
      });
      setNewKeyword('');
      setSelectedFlowId('');
      fetchData();
    } catch (error) {
      console.error('Failed to save trigger', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this keyword trigger?')) return;
    try {
      await fetch(`http://localhost:4000/api/triggers/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Keyword Triggers</h1>
        <p className="text-gray-500">Map incoming WhatsApp text keywords to specific Flows.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Trigger</h2>
        <form onSubmit={handleSave} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
            <input 
              type="text" 
              required
              placeholder="e.g. book, hi, appointment"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black p-2 border"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Flow</label>
            <select
              required
              value={selectedFlowId}
              onChange={e => setSelectedFlowId(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black p-2 border bg-white"
            >
              <option value="">Select a flow...</option>
              {flows.map((flow: any) => (
                <option key={flow.id} value={flow.id}>
                  {flow.name} ({flow.status})
                </option>
              ))}
            </select>
          </div>
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
          >
            Add Keyword
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Flow</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {triggers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No keyword triggers defined yet.
                </td>
              </tr>
            ) : (
              triggers.map((trigger: any) => (
                <tr key={trigger.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    "{trigger.keyword}"
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trigger.flow?.name || 'Unknown Flow'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(trigger.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
