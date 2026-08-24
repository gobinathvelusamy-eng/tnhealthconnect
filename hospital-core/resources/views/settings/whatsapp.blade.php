<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('WhatsApp Meta Integration') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            
            @if(session('success'))
                <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <span class="block sm:inline">{{ session('success') }}</span>
                </div>
            @endif

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                <div class="p-6 bg-white border-b border-gray-200">
                    <h3 class="text-lg font-bold mb-4 text-blue-600"><i class="fas fa-plug mr-2"></i> Webhook Configuration (For Meta Portal)</h3>
                    <p class="text-sm text-gray-600 mb-4">Copy these details into the Meta App Dashboard under <strong>WhatsApp > Configuration</strong>.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Callback URL (Webhook)</label>
                            <div class="flex items-center">
                                <input type="text" readonly value="{{ url('/api/webhook/whatsapp') }}" class="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Note: Meta requires this URL to be public (HTTPS). If developing locally, use ngrok.</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Verify Token</label>
                            <input type="text" readonly value="{{ $settings['webhook_verify_token'] ?? '' }}" class="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <h3 class="text-lg font-bold mb-4 text-green-600"><i class="fab fa-whatsapp mr-2"></i> WhatsApp API Credentials</h3>
                    <p class="text-sm text-gray-600 mb-4">Enter the credentials from your Meta App Dashboard here so the bot can send messages.</p>
                    
                    <form method="POST" action="{{ route('settings.whatsapp.update') }}">
                        @csrf
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Temporary or Permanent Access Token</label>
                            <input type="text" name="whatsapp_access_token" value="{{ old('whatsapp_access_token', $settings['whatsapp_access_token'] ?? '') }}" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required>
                            @error('whatsapp_access_token') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                            <input type="text" name="whatsapp_phone_number_id" value="{{ old('whatsapp_phone_number_id', $settings['whatsapp_phone_number_id'] ?? '') }}" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required>
                            @error('whatsapp_phone_number_id') <span class="text-red-500 text-xs">{{ $message }}</span> @enderror
                        </div>

                        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded shadow">
                            Save Credentials
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
