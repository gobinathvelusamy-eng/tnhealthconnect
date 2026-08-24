"use client";
export default function PaymentsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Transactions & Payments</h1>
      
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
           <h2 className="font-bold">Recent Razorpay Transactions</h2>
           <button className="bg-white border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-100">Export CSV</button>
        </div>
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-900">Transaction ID</th>
              <th className="px-6 py-3 font-medium text-gray-900">Patient</th>
              <th className="px-6 py-3 font-medium text-gray-900">Amount</th>
              <th className="px-6 py-3 font-medium text-gray-900">Date</th>
              <th className="px-6 py-3 font-medium text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No payment transactions have been recorded yet.
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
