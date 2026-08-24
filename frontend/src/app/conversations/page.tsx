'use client';
import React, { useState } from 'react';

export default function ConversationsPage() {
  const [conversations] = useState([]);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      
      {/* Left Panel: Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Inbox</h2>
          <input type="text" placeholder="Search conversations..." className="mt-2 w-full p-2 border border-gray-300 rounded text-sm" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No active conversations found.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Panel: Chat History & State */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Select a conversation to view details</p>
        </div>
      </div>
    </div>
  );
}
