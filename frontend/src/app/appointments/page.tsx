"use client";
export default function AppointmentsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Appointments Inbox</h1>
      <div className="bg-white rounded-lg shadow border border-gray-200">
         <div className="p-12 text-center text-gray-500">
            No appointments have been booked via WhatsApp yet.
         </div>
      </div>
    </div>
  );
}
