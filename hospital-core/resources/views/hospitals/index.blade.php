<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Hospitals
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

            @if (session('success'))
                <div class="mb-4 p-4 bg-green-100 text-green-800 rounded">
                    {{ session('success') }}
                </div>
            @endif

            <div class="mb-4">
                <a href="{{ route('hospitals.create') }}" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    + Add Hospital
                </a>
            </div>

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b">
                            <th class="py-2">Name</th>
                            <th class="py-2">Location</th>
                            <th class="py-2">Phone</th>
                            <th class="py-2">Status</th>
                            <th class="py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($hospitals as $hospital)
                            <tr class="border-b">
                                <td class="py-2">{{ $hospital->name }}</td>
                                <td class="py-2">{{ $hospital->location }}</td>
                                <td class="py-2">{{ $hospital->phone }}</td>
                                <td class="py-2">{{ $hospital->status }}</td>
                                <td class="py-2">
                                    <a href="{{ route('hospitals.edit', $hospital->id) }}" class="text-blue-600">Edit</a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="py-4 text-gray-500">No hospitals added yet.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</x-app-layout>