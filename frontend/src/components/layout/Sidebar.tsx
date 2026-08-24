import Link from 'next/link';

export function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-xl font-bold mb-8">TN Health Connect</h1>
      <nav className="flex flex-col space-y-2">
        <Link href="/" className="hover:bg-gray-800 p-2 rounded">Dashboard</Link>
        <Link href="/whatsapp" className="hover:bg-gray-800 p-2 rounded">WhatsApp Connection</Link>
        <Link href="/templates" className="hover:bg-gray-800 p-2 rounded">Templates</Link>
        <Link href="/flows" className="hover:bg-gray-800 p-2 rounded">Flow Builder</Link>
        <Link href="/triggers" className="hover:bg-gray-800 p-2 rounded text-green-400">Keyword Triggers</Link>
        <Link href="/conversations" className="hover:bg-gray-800 p-2 rounded">Conversations</Link>
        <Link href="/appointments" className="hover:bg-gray-800 p-2 rounded">Appointments</Link>
        <Link href="/payments" className="hover:bg-gray-800 p-2 rounded">Payments</Link>
        <Link href="/settings" className="hover:bg-gray-800 p-2 rounded">Settings</Link>
      </nav>
    </div>
  );
}
