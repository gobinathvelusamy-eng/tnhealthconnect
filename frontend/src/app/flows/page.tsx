"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FlowItem {
  id: string;
  name: string;
  status: string;
  versions: Array<{ versionNumber: number }>;
  keywordTriggers?: Array<{ id: string; keyword: string }>;
  conversations?: Array<any>;
}

export default function FlowsOverview() {
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [warningModal, setWarningModal] = useState<{
    flow: FlowItem;
    triggers: string[];
  } | null>(null);

  const fetchFlows = () => {
    fetch('http://localhost:4000/api/flows')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFlows(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const executeDelete = async (flowId: string, force: boolean = false) => {
    setDeletingId(flowId);
    try {
      const url = `http://localhost:4000/api/flows/${flowId}${force ? '?force=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (data.isConnected && !force) {
        // Flow is connected, show warning modal
        const flow = flows.find(f => f.id === flowId);
        if (flow) {
          setWarningModal({
            flow,
            triggers: data.linkedTriggers || flow.keywordTriggers?.map(t => t.keyword) || []
          });
        }
      } else if (data.success) {
        setWarningModal(null);
        fetchFlows();
      } else {
        alert(data.error || 'Failed to delete flow');
      }
    } catch (err) {
      console.error('Delete flow error:', err);
      alert('Error connecting to server while deleting flow.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteClick = (flow: FlowItem) => {
    const isConnected = (flow.keywordTriggers && flow.keywordTriggers.length > 0);
    if (isConnected) {
      // Flow is connected to system triggers -> Show warning modal
      setWarningModal({
        flow,
        triggers: flow.keywordTriggers?.map(t => t.keyword) || []
      });
    } else {
      // Flow is not connected -> Delete immediately without warning
      executeDelete(flow.id, false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Flows</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and create interactive WhatsApp flows</p>
        </div>
        <Link 
          href="/flows/builder" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <span>+</span> Create New Flow
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading flows...</div>
        ) : flows.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium text-gray-700">No flows created yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click "+ Create New Flow" above to build your first flow.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {flows.map(flow => {
              const connectedTriggers = flow.keywordTriggers || [];
              const isConnected = connectedTriggers.length > 0;

              return (
                <div key={flow.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/flows/builder?id=${flow.id}`} 
                        className="font-bold text-lg text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {flow.name}
                      </Link>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                          Trigger: {connectedTriggers.map(t => `"${t.keyword}"`).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Latest Version: v{flow.versions[0]?.versionNumber || 1}</span>
                      <span>•</span>
                      <span className="font-mono text-gray-400">ID: {flow.id.length > 18 ? `${flow.id.substring(0, 14)}...` : flow.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      flow.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {flow.status}
                    </span>

                    <Link 
                      href={`/flows/builder?id=${flow.id}`} 
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Edit Flow
                    </Link>

                    <button
                      onClick={() => handleDeleteClick(flow)}
                      disabled={deletingId === flow.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 disabled:opacity-50"
                      title={isConnected ? 'Delete flow (connected to system)' : 'Delete flow immediately'}
                    >
                      {deletingId === flow.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warning Confirmation Modal for Connected Flows */}
      {warningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 text-2xl">
              ⚠️
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Flow is Connected to System
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              <span className="font-semibold text-gray-800">"{warningModal.flow.name}"</span> is actively linked to the following keyword trigger(s):
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Active Keyword Triggers:</div>
              <div className="flex flex-wrap gap-1.5">
                {warningModal.triggers.map((kw, i) => (
                  <span key={i} className="bg-white px-2 py-0.5 rounded text-xs font-mono font-bold text-amber-900 border border-amber-300">
                    "{kw}"
                  </span>
                ))}
              </div>
              <p className="text-xs text-amber-700 mt-2">
                Deleting this flow will automatically disconnect these triggers. WhatsApp users sending these keywords will no longer receive this flow.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3">
              <button
                onClick={() => setWarningModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDelete(warningModal.flow.id, true)}
                disabled={deletingId === warningModal.flow.id}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {deletingId === warningModal.flow.id ? 'Deleting...' : 'Yes, Delete & Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
