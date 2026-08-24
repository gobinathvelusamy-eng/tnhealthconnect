"use client";
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [tokenMasked, setTokenMasked] = useState('');

  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [secretMasked, setSecretMasked] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/settings')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setWhatsappPhoneId(res.data.whatsappPhoneNumberId || '');
          setTokenMasked(res.data.whatsappAccessTokenMasked || '');
          setRazorpayKeyId(res.data.razorpayKeyId || '');
          setSecretMasked(res.data.razorpayKeySecretMasked || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(null);

    try {
      const payload: any = {};
      if (whatsappPhoneId) payload.whatsappPhoneNumberId = whatsappPhoneId;
      if (whatsappToken) payload.whatsappAccessToken = whatsappToken;
      if (razorpayKeyId) payload.razorpayKeyId = razorpayKeyId;
      if (razorpayKeySecret) payload.razorpayKeySecret = razorpayKeySecret;

      const res = await fetch('http://localhost:4000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSavedMessage('✅ Settings saved successfully! All API keys are updated in the system.');
        setWhatsappToken('');
        setRazorpayKeySecret('');
        // Refresh masked data
        const r = await fetch('http://localhost:4000/api/settings');
        const d = await r.json();
        if (d.success && d.data) {
          setTokenMasked(d.data.whatsappAccessTokenMasked || '');
          setSecretMasked(d.data.razorpayKeySecretMasked || '');
        }
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage WhatsApp Business API, Razorpay Payment Gateway, and Hospital Backend connections</p>
      </div>

      {savedMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl font-medium shadow-sm flex items-center justify-between">
          <span>{savedMessage}</span>
          <button onClick={() => setSavedMessage(null)} className="text-green-600 hover:text-green-800 font-bold">×</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Gateway (Razorpay) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              💳
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Razorpay Payment Gateway</h2>
              <p className="text-xs text-gray-500">Automate instant consultation fee payment links inside WhatsApp</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Razorpay Key ID
              </label>
              <input 
                type="text" 
                value={razorpayKeyId} 
                onChange={e => setRazorpayKeyId(e.target.value)}
                placeholder="rzp_test_... or rzp_live_..." 
                className="w-full border-gray-300 rounded-lg p-2.5 border font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              <p className="text-xs text-gray-400 mt-1">Find this in your Razorpay Dashboard ➔ Settings ➔ API Keys</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Razorpay Key Secret
              </label>
              <input 
                type="password" 
                value={razorpayKeySecret}
                onChange={e => setRazorpayKeySecret(e.target.value)}
                placeholder={secretMasked ? `Configured (${secretMasked}) - Enter new value to update` : "Enter Razorpay Key Secret"} 
                className="w-full border-gray-300 rounded-lg p-2.5 border font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              {secretMasked && (
                <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                  <span>✓ Active Key Secret:</span> <span className="font-mono text-gray-600">{secretMasked}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meta API Credentials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold text-xl">
              💬
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Meta WhatsApp Cloud API</h2>
              <p className="text-xs text-gray-500">Phone number ID and access token for sending & receiving messages</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number ID</label>
              <input 
                type="text" 
                value={whatsappPhoneId}
                onChange={e => setWhatsappPhoneId(e.target.value)}
                placeholder="1251843004678089" 
                className="w-full border-gray-300 rounded-lg p-2.5 border font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Access Token</label>
              <input 
                type="password" 
                value={whatsappToken}
                onChange={e => setWhatsappToken(e.target.value)}
                placeholder={tokenMasked ? `Configured (${tokenMasked}) - Enter new token to update` : "EAAbx..."} 
                className="w-full border-gray-300 rounded-lg p-2.5 border font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              {tokenMasked && (
                <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                  <span>✓ Active Token:</span> <span className="font-mono text-gray-600">{tokenMasked}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hospital Backend API */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
              🏥
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Hospital Backend Integration</h2>
              <p className="text-xs text-gray-500">Connected database providing live doctors, slots, and departments</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Laravel API URL</label>
              <input 
                type="text" 
                defaultValue="http://localhost:8000/api" 
                className="w-full border-gray-300 rounded-lg p-2.5 border bg-gray-50 font-mono text-sm text-gray-700" 
                readOnly 
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync Active with Hospital Database (Districts, Places, Hospitals, Slots)
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-bold shadow-md transition-all disabled:opacity-50 text-base flex items-center gap-2"
          >
            {saving ? 'Saving...' : '💾 Save All Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
}
