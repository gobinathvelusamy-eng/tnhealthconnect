import React from 'react';

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Active Conversations</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Messages Today</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Appointments Booked</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Payments Collected</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹0</p>
        </div>
      </div>

      {/* Monitoring Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* API Health */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Meta WhatsApp Cloud API</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">CONNECTED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">TN Health Connect Backend API</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">HEALTHY</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Razorpay Webhook</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">WAITING</span>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Automation Logs</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
