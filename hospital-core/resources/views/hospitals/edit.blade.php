<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Edit Hospital
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-2xl mx-auto sm:px-6 lg:px-8">

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">

                @if ($errors->any())
                    <div class="mb-4 p-4 bg-red-100 text-red-800 rounded">
                        <ul class="list-disc list-inside">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form method="POST" action="{{ route('hospitals.update', $hospital->id) }}">
                    @csrf
                    @method('PUT')

                    <div class="mb-4">
                        <label class="block font-medium text-sm text-gray-700">Hospital Name</label>
                        <input type="text" name="name" value="{{ old('name', $hospital->name) }}"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    </div>

                    <div class="mb-4">
                        <label class="block font-medium text-sm text-gray-700">Location (City/Area)</label>
                        <input type="text" name="location" value="{{ old('location', $hospital->location) }}"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    </div>

                    <div class="mb-4">
                        <label class="block font-medium text-sm text-gray-700">Address</label>
                        <textarea name="address" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">{{ old('address', $hospital->address) }}</textarea>
                    </div>

                    <div class="mb-4">
                        <label class="block font-medium text-sm text-gray-700">Phone</label>
                        <input type="text" name="phone" value="{{ old('phone', $hospital->phone) }}"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    </div>

                    <div class="mb-4">
                        <label class="block font-medium text-sm text-gray-700">Status</label>
                        <select name="status" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="active" {{ $hospital->status == 'active' ? 'selected' : '' }}>Active</option>
                            <option value="inactive" {{ $hospital->status == 'inactive' ? 'selected' : '' }}>Inactive</option>
                        </select>
                    </div>

                    <div class="flex justify-end gap-3">
                        <a href="{{ route('hospitals.index') }}" class="px-4 py-2 text-gray-600">Cancel</a>
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Update Hospital
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>