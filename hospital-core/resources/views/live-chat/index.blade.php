<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Live Chat (Human Handoff)') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900">
                    @if (session('success'))
                        <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <span class="block sm:inline">{{ session('success') }}</span>
                        </div>
                    @endif

                    @if($sessions->isEmpty())
                        <p class="text-gray-500 text-center py-8">No patients are currently requesting human assistance.</p>
                    @else
                        <div class="space-y-6">
                            @foreach($sessions as $session)
                                <div class="border rounded-lg p-6 bg-gray-50">
                                    <div class="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 class="text-lg font-bold">Patient: {{ $session->phone_number }}</h3>
                                            <p class="text-sm text-gray-500">Requested human help at: {{ $session->updated_at->format('M d, Y h:i A') }}</p>
                                        </div>
                                        <form action="{{ route('live-chat.resolve', $session) }}" method="POST">
                                            @csrf
                                            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                                Resolve & Return to Bot
                                            </button>
                                        </form>
                                    </div>
                                    
                                    <div class="mt-4 border-t pt-4">
                                        <form action="{{ route('live-chat.reply', $session) }}" method="POST" class="flex gap-4">
                                            @csrf
                                            <input type="text" name="message" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Type your reply to WhatsApp..." required>
                                            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                                                Send Reply
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
