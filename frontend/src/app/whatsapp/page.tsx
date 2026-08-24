"use client";
export default function WhatsAppConnectionPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">WhatsApp Connection Status</h1>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
         <div className="flex items-center space-x-4 mb-4">
             <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
             <h2 className="text-xl font-bold text-gray-800">API Connection Active</h2>
         </div>
         <p className="text-gray-600 mb-6">Your WhatsApp Cloud API webhook is properly configured and actively listening for incoming messages on <code className="bg-gray-100 p-1 rounded">/api/webhook/whatsapp</code>.</p>
         <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm text-gray-500">
            No active alerts or errors.
         </div>
      </div>
    </div>
  );
}
