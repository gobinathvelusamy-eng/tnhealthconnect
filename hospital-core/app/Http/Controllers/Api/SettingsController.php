<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Get all platform settings
     */
    public function index()
    {
        $settings = DB::table('platform_settings')->get();
        return response()->json($settings);
    }

    /**
     * Update specific settings
     */
    public function update(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            DB::table('platform_settings')
                ->updateOrInsert(
                    ['setting_key' => $key],
                    ['setting_value' => $value]
                );
        }

        return response()->json(['success' => true, 'message' => 'Settings updated successfully']);
    }
}
